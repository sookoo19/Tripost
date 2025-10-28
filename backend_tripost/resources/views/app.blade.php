<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-TZGS0KZGVN"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-TZGS0KZGVN');

            // ここを追加：SPA 側が参照するためのグローバル変数
            window.GA_ID = 'G-TZGS0KZGVN';
        </script>

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="format-detection" content="telephone=no">

        <title inertia>{{ config('app.name', 'Tripost') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Global default OGP (ページごとに上書き可能) -->
        <meta property="og:site_name" content="Tripost(トリポスト)">
        <meta property="og:type" content="website">
        <meta property="og:title" content="{{ config('app.name', 'Tripost') }}">
        <meta property="og:description" content="旅の計画も、思い出も。みんなとシェアしよう。">
        <meta property="og:image" content="{{ asset('images/ogp.jpg') }}">
        <meta property="og:url" content="{{ url()->current() }}">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ config('app.name', 'Tripost') }}">
        <meta name="twitter:description" content="旅の計画も、思い出も。みんなとシェアしよう。">
        <meta name="twitter:image" content="{{ asset('images/ogp.jpg') }}">
        
        <!-- PWA / iOS -->
        <link rel="manifest" href="{{ asset('manifest.json') }}">
        <meta name="theme-color" content="#F7D200">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('icons/apple-touch-icon.png') }}">
        <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">

        <!-- Optional: Safari pinned tab icon -->
        <!-- <link rel="mask-icon" href="{{ asset('icons/safari-pinned-tab.svg') }}" color="#F7D200"> -->


        <!-- Scripts / Vite -->
        @routes
        @viteReactRefresh
        @vite([
          'resources/js/app.jsx',
          isset($page['component']) ? "resources/js/Pages/{$page['component']}.jsx" : null
        ])

        {{-- Inertia head: ページごとの Head がここに挿入され、上書きできます --}}
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>

