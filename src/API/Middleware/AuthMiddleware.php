<?php

declare(strict_types=1);

namespace CartMilestones\API\Middleware;

class AuthMiddleware {

	/**
	 * Permission callback for admin-only write endpoints.
	 */
	public static function manage_woocommerce( \WP_REST_Request $request ): bool|\WP_Error {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			return new \WP_Error(
				'cm_forbidden',
				__( 'You do not have permission to perform this action.', 'boostcart' ),
				[ 'status' => 403 ]
			);
		}
		return true;
	}

	/**
	 * Permission callback for public read endpoints (nonce-gated for logged-in users).
	 */
	public static function public_read( \WP_REST_Request $request ): bool {
		return true;
	}
}
