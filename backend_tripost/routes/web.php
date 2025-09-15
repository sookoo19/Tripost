<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PlaceController;
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
Route::get('/posts/search', [PostController::class, 'searchPosts'])->name('posts.search'); // 投稿検索
Route::get('/posts/search/result', [PostController::class, 'searchIndex'])->name('posts.searchResult'); // 投稿検索
Route::get('/users/{user}/posts', [PostController::class, 'userPosts'])->name('users.posts'); // ユーザーごとの投稿一覧
Route::get('/profile/{user}', [ProfileController::class, 'showPublic'])->name('users.profile'); // 他ユーザーのプロフィール

// ▼ ログインユーザーのみ（プロフィール編集・投稿作成/編集/削除）
Route::middleware(['auth', 'verified'])->group(function () {
    // 自分のプロフィール管理
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    //フォロー状態の確認・付与・解除
    Route::get('/follow/status/{id}',[FollowController::class,'check_following'])->name('follow.check');
    Route::post('/follow/add',[FollowController::class,'following'])->name('following');
    Route::post('/follow/remove',[FollowController::class,'unfollowing'])->name('unfollowing');
    Route::get('/follow/following/index/{user}',[FollowController::class,'following_index'])->name('following.index');
    Route::get('/follow/follower/index/{user}',[FollowController::class,'follower_index'])->name('follower.index');

    // 投稿詳細・作成・編集・削除
    Route::get('/posts/create', [PostController::class, 'create'])->name('posts.create');
    Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show'); 
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->name('posts.edit');
    Route::put('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
});


require __DIR__.'/auth.php';
