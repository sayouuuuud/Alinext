<?php
/**
 * Inspect, publish, or selectively roll back AliFleet's required WordPress pages.
 *
 * Run through WP-CLI. Inspection is the default and never writes:
 *
 *   wp eval-file repair-required-pages.php inspect group=all
 *   wp eval-file repair-required-pages.php apply group=woocommerce journal=woo-pages.json
 *   wp eval-file repair-required-pages.php apply group=cms journal=cms-pages.json
 *   wp eval-file repair-required-pages.php rollback journal=woo-pages.json
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	fwrite( STDERR, "This script must be run through WP-CLI: wp eval-file ...\n" );
	exit( 1 );
}

$definitions = [
	[ 'id' => 936, 'slug' => 'shop', 'group' => 'woocommerce', 'option' => 'woocommerce_shop_page_id' ],
	[ 'id' => 937, 'slug' => 'cart', 'group' => 'woocommerce', 'option' => 'woocommerce_cart_page_id', 'shortcode' => 'woocommerce_cart' ],
	[ 'id' => 938, 'slug' => 'checkout', 'group' => 'woocommerce', 'option' => 'woocommerce_checkout_page_id', 'shortcode' => 'woocommerce_checkout' ],
	[ 'id' => 939, 'slug' => 'my-account', 'group' => 'woocommerce', 'option' => 'woocommerce_myaccount_page_id', 'shortcode' => 'woocommerce_my_account' ],
	[ 'id' => 2368, 'slug' => 'home', 'group' => 'cms' ],
	[ 'id' => 4273, 'slug' => 'cars', 'group' => 'cms' ],
	[ 'id' => 4274, 'slug' => 'products', 'group' => 'cms' ],
	[ 'id' => 2218, 'slug' => 'blog', 'group' => 'cms' ],
	[ 'id' => 3351, 'slug' => 'contact', 'group' => 'cms' ],
	[ 'id' => 849, 'slug' => 'privacy-policy-ar', 'group' => 'cms' ],
	[ 'id' => 853, 'slug' => 'privacy-policy-en', 'group' => 'cms' ],
	[ 'id' => 848, 'slug' => 'privacy-policy-he', 'group' => 'cms' ],
	[ 'id' => 858, 'slug' => 'terms-ar', 'group' => 'cms' ],
	[ 'id' => 861, 'slug' => 'terms-en', 'group' => 'cms' ],
	[ 'id' => 856, 'slug' => 'terms-he', 'group' => 'cms' ],
	[ 'id' => 1030, 'slug' => 'return-policy-ar', 'group' => 'cms' ],
	[ 'id' => 1033, 'slug' => 'return-policy-en', 'group' => 'cms' ],
	[ 'id' => 1029, 'slug' => 'return-policy-he', 'group' => 'cms' ],
	[ 'id' => 940, 'slug' => 'refund_returns', 'group' => 'cms' ],
];

$assoc = [];
foreach ( $args ?? [] as $arg ) {
	$arg = (string) $arg;
	if ( in_array( $arg, [ 'inspect', 'apply', 'rollback' ], true ) ) {
		$assoc['mode'] = $arg;
		continue;
	}
	if ( preg_match( '/^-{0,2}([a-z-]+)(?:=(.*))?$/', $arg, $matches ) ) {
		$assoc[ $matches[1] ] = $matches[2] ?? true;
	}
}

$mode  = isset( $assoc['mode'] ) ? (string) $assoc['mode'] : 'inspect';
$group = isset( $assoc['group'] ) ? (string) $assoc['group'] : 'all';

if ( ! in_array( $mode, [ 'inspect', 'apply', 'rollback' ], true ) ) {
	WP_CLI::error( 'Invalid mode. Use inspect, apply, or rollback.' );
}
if ( ! in_array( $group, [ 'all', 'woocommerce', 'cms' ], true ) ) {
	WP_CLI::error( 'Invalid group. Use all, woocommerce, or cms.' );
}

$repair_dir = '/tmp/alifleet-stage';
$journal_name = isset( $assoc['journal'] )
	? (string) $assoc['journal']
	: 'required-pages-' . gmdate( 'Ymd-His' ) . '.json';

if ( ! preg_match( '/\A[a-zA-Z0-9][a-zA-Z0-9._-]*\.json\z/', $journal_name ) ) {
	WP_CLI::error( 'journal must be a .json filename without a directory.' );
}

$journal_path = $repair_dir . '/' . $journal_name;

/**
 * Return the immutable and rollback-relevant state of one page.
 *
 * @return array<string,mixed>|null
 */
function alifleet_repair_page_state( int $post_id ): ?array {
	$post = get_post( $post_id );
	if ( ! $post instanceof WP_Post ) {
		return null;
	}

	return [
		'id'             => (int) $post->ID,
		'type'           => (string) $post->post_type,
		'slug'           => (string) $post->post_name,
		'status'         => (string) $post->post_status,
		'modified_gmt'   => (string) $post->post_modified_gmt,
		'content_sha256' => hash( 'sha256', (string) $post->post_content ),
		'title_sha256'   => hash( 'sha256', (string) $post->post_title ),
	];
}

/**
 * Atomically persist a rollback journal without page content or credentials.
 *
 * @param array<string,mixed> $journal Journal data.
 */
function alifleet_repair_write_journal( string $path, array $journal ): void {
	$encoded = wp_json_encode( $journal, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
	if ( ! is_string( $encoded ) ) {
		WP_CLI::error( 'Could not encode the rollback journal.' );
	}

	$temp_path = $path . '.tmp';
	if ( false === file_put_contents( $temp_path, $encoded . "\n", LOCK_EX ) ) {
		WP_CLI::error( 'Could not write the rollback journal.' );
	}
	chmod( $temp_path, 0600 );
	if ( ! rename( $temp_path, $path ) ) {
		WP_CLI::error( 'Could not finalize the rollback journal.' );
	}
}

/**
 * Validate every target before the first write.
 *
 * @param array<int,array<string,mixed>> $targets Target definitions.
 * @return array<int,array<string,mixed>> Current page states.
 */
function alifleet_repair_validate_targets( array $targets ): array {
	$states = [];
	$errors = [];

	foreach ( $targets as $definition ) {
		$id    = (int) $definition['id'];
		$state = alifleet_repair_page_state( $id );
		if ( null === $state ) {
			$errors[] = sprintf( '%d (%s) is missing.', $id, $definition['slug'] );
			continue;
		}

		if ( 'page' !== $state['type'] ) {
			$errors[] = sprintf( '%d has type %s, expected page.', $id, $state['type'] );
		}
		if ( $definition['slug'] !== $state['slug'] ) {
			$errors[] = sprintf( '%d has slug %s, expected %s.', $id, $state['slug'], $definition['slug'] );
		}
		if ( ! in_array( $state['status'], [ 'draft', 'publish' ], true ) ) {
			$errors[] = sprintf( '%d has unsafe status %s; refusing to change it.', $id, $state['status'] );
		}

		if ( isset( $definition['option'] ) ) {
			$mapped_id = (int) get_option( (string) $definition['option'], 0 );
			if ( $id !== $mapped_id ) {
				$errors[] = sprintf( '%s maps to %d, expected %d.', $definition['option'], $mapped_id, $id );
			}
		}

		if ( isset( $definition['shortcode'] ) ) {
			$post = get_post( $id );
			if ( ! $post instanceof WP_Post || ! has_shortcode( (string) $post->post_content, (string) $definition['shortcode'] ) ) {
				$errors[] = sprintf( '%d is missing [%s].', $id, $definition['shortcode'] );
			}
		}

		$states[ $id ] = $state;
	}

	if ( $errors ) {
		foreach ( $errors as $error ) {
			WP_CLI::warning( $error );
		}
		WP_CLI::error( 'Target validation failed; no pages were changed.' );
	}

	return $states;
}

$targets = array_values(
	array_filter(
		$definitions,
		static function ( array $definition ) use ( $group ): bool {
			return 'all' === $group || $group === $definition['group'];
		}
	)
);

if ( 'rollback' !== $mode ) {
	$states = alifleet_repair_validate_targets( $targets );

	WP_CLI::line( sprintf( 'Mode: %s | Group: %s | Targets: %d', $mode, $group, count( $targets ) ) );
	WP_CLI::line( "ID\tGROUP\tSLUG\tSTATUS\tACTION" );
	foreach ( $targets as $definition ) {
		$state  = $states[ (int) $definition['id'] ];
		$action = 'publish' === $state['status'] ? 'skip' : 'publish';
		WP_CLI::line( sprintf( "%d\t%s\t%s\t%s\t%s", $state['id'], $definition['group'], $state['slug'], $state['status'], $action ) );
	}

	if ( 'inspect' === $mode ) {
		WP_CLI::success( 'Inspection complete; no pages were changed.' );
		return;
	}

	if ( ! is_dir( $repair_dir ) || ! is_writable( $repair_dir ) ) {
		WP_CLI::error( sprintf( '%s must exist and be writable before apply.', $repair_dir ) );
	}
	if ( file_exists( $journal_path ) ) {
		WP_CLI::error( sprintf( 'Journal already exists: %s', $journal_path ) );
	}

	$journal = [
		'schema'      => 1,
		'operation'   => 'publish-required-pages',
		'created_gmt' => gmdate( 'c' ),
		'group'       => $group,
		'pages'       => [],
	];
	alifleet_repair_write_journal( $journal_path, $journal );

	foreach ( $targets as $definition ) {
		$id       = (int) $definition['id'];
		$previous = $states[ $id ];
		$record   = [
			'definition' => $definition,
			'previous'   => $previous,
			'changed'    => false,
			'result'     => $previous,
		];

		if ( 'publish' === $previous['status'] ) {
			$journal['pages'][] = $record;
			alifleet_repair_write_journal( $journal_path, $journal );
			continue;
		}

		$record['pending'] = true;
		$record_index      = count( $journal['pages'] );
		$journal['pages'][] = $record;
		alifleet_repair_write_journal( $journal_path, $journal );

		$result = wp_update_post( [ 'ID' => $id, 'post_status' => 'publish' ], true );
		if ( is_wp_error( $result ) ) {
			WP_CLI::error( sprintf( 'Failed to publish %d: %s. Journal: %s', $id, $result->get_error_message(), $journal_path ) );
		}
		clean_post_cache( $id );
		$current = alifleet_repair_page_state( $id );
		if (
			null === $current ||
			'publish' !== $current['status'] ||
			$previous['slug'] !== $current['slug'] ||
			$previous['content_sha256'] !== $current['content_sha256'] ||
			$previous['title_sha256'] !== $current['title_sha256']
		) {
			WP_CLI::error( sprintf( 'Post-write verification failed for %d. Journal: %s', $id, $journal_path ) );
		}

		$record['changed'] = true;
		$record['result']  = $current;
		unset( $record['pending'] );
		$journal['pages'][ $record_index ] = $record;
		alifleet_repair_write_journal( $journal_path, $journal );
	}

	$journal['completed_gmt'] = gmdate( 'c' );
	alifleet_repair_write_journal( $journal_path, $journal );
	WP_CLI::success( sprintf( 'Required pages published and verified. Journal: %s', $journal_path ) );
	return;
}

if ( ! is_readable( $journal_path ) ) {
	WP_CLI::error( sprintf( 'Rollback journal is not readable: %s', $journal_path ) );
}

$journal = json_decode( (string) file_get_contents( $journal_path ), true );
if (
	! is_array( $journal ) ||
	1 !== (int) ( $journal['schema'] ?? 0 ) ||
	'publish-required-pages' !== ( $journal['operation'] ?? '' ) ||
	! isset( $journal['pages'] ) ||
	! is_array( $journal['pages'] )
) {
	WP_CLI::error( 'Rollback journal is invalid or unsupported.' );
}

$rollback_records = array_values(
	array_filter(
		$journal['pages'],
		static function ( $record ): bool {
			return is_array( $record ) && ! empty( $record['changed'] );
		}
	)
);

foreach ( $rollback_records as $record ) {
	$previous = $record['previous'] ?? [];
	$result   = $record['result'] ?? [];
	$id       = (int) ( $previous['id'] ?? 0 );
	$current  = alifleet_repair_page_state( $id );

	if ( null === $current ) {
		WP_CLI::error( sprintf( 'Cannot roll back missing page %d.', $id ) );
	}
	if ( $current['status'] === ( $previous['status'] ?? '' ) ) {
		continue;
	}
	if (
		$current['slug'] !== ( $previous['slug'] ?? '' ) ||
		$current['status'] !== ( $result['status'] ?? '' ) ||
		$current['modified_gmt'] !== ( $result['modified_gmt'] ?? '' ) ||
		$current['content_sha256'] !== ( $previous['content_sha256'] ?? '' ) ||
		$current['title_sha256'] !== ( $previous['title_sha256'] ?? '' )
	) {
		WP_CLI::error( sprintf( 'Page %d changed after repair; rollback aborted before any write.', $id ) );
	}
}

foreach ( array_reverse( $rollback_records ) as $record ) {
	$previous = $record['previous'];
	$id       = (int) $previous['id'];
	$current  = alifleet_repair_page_state( $id );
	if ( null !== $current && $current['status'] === $previous['status'] ) {
		WP_CLI::log( sprintf( '%d already has its previous status; skipping.', $id ) );
		continue;
	}

	$result = wp_update_post( [ 'ID' => $id, 'post_status' => $previous['status'] ], true );
	if ( is_wp_error( $result ) ) {
		WP_CLI::error( sprintf( 'Failed to roll back %d: %s', $id, $result->get_error_message() ) );
	}
	clean_post_cache( $id );
	$restored = alifleet_repair_page_state( $id );
	if (
		null === $restored ||
		$restored['status'] !== $previous['status'] ||
		$restored['content_sha256'] !== $previous['content_sha256'] ||
		$restored['title_sha256'] !== $previous['title_sha256']
	) {
		WP_CLI::error( sprintf( 'Rollback verification failed for %d.', $id ) );
	}
}

WP_CLI::success( sprintf( 'Selective rollback completed from %s.', $journal_path ) );
