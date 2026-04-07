<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

class TrustProxies extends Middleware
{
    // すべてのプロキシを信頼
    protected $proxies = '*';

    // X-Forwarded-* ヘッダを使用
    protected $headers = Request::HEADER_X_FORWARDED_ALL;
}