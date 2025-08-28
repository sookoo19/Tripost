<?php

use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// トップページ
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// ダッシュボード（要ログイン・認証）
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// ▼ ゲストも閲覧できるルート（投稿・ユーザープロフィールの閲覧）
Route::get('/posts', [PostController::class, 'index'])->name('posts.index'); // 全投稿一覧
Route::get('/users/{user}/posts', [PostController::class, 'userPosts'])->name('users.posts'); // ユーザーごとの投稿一覧
Route::get('/users/{user}', [ProfileController::class, 'showPublic'])->name('users.profile'); // 他ユーザーのプロフィール

// ▼ ログインユーザーのみ（プロフィール編集・投稿作成/編集/削除）
Route::middleware(['auth', 'verified'])->group(function () {
    // 自分のプロフィール管理
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // 投稿詳細・作成・編集・削除
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show'); 
    Route::get('/posts/create', [PostController::class, 'create'])->name('posts.create');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->name('posts.edit');
    Route::put('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
});

require __DIR__.'/auth.php';
