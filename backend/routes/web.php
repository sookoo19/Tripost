<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PlaceController;
use App\Http\Controllers\PostLikeController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\NotificationController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// トップページ
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('posts.index');
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});


// ▼ ゲストも閲覧できるルート（投稿・ユーザープロフィールの閲覧）
Route::get('/posts', [PostController::class, 'index'])->name('posts.index'); // 全投稿一覧
Route::get('/posts/search', [PostController::class, 'searchPosts'])->name('posts.search'); // 投稿検索
Route::get('/posts/search/result', [PostController::class, 'searchIndex'])->name('posts.searchResult'); // 投稿検索
Route::get('/users/{user}/posts', [PostController::class, 'userPosts'])->name('users.posts'); // ユーザーごとの投稿一覧

// ▼ ログインユーザーのみ
Route::middleware(['auth', 'verified'])->group(function () {
    // 自分のプロフィール管理
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::get('/profile/destroy', [ProfileController::class, 'destroy_confirm'])->name('profile.destroy_confirm');
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
    Route::get('/posts/draft', [PostController::class, 'draft'])->name('posts.draft');
    Route::get('/posts/unpublic', [PostController::class, 'unpublic'])->name('posts.unpublic');
    Route::get('/posts/mylikes', [PostController::class, 'mylikes'])->name('posts.mylikes');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->name('posts.edit');
    Route::post('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::patch('/posts/{post}/sharescope', [PostController::class, 'update_share_scope'])->name('posts.share_scope');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');


    Route::post('/posts/{post}/like', [PostLikeController::class, 'store'])->name('posts.like');
    Route::delete('/posts/{post}/like', [PostLikeController::class, 'destroy'])->name('posts.unlike');
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])->name('posts.comments.store');
});

// 通知関連
Route::middleware('auth')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/count', [NotificationController::class, 'getUnreadCount'])->name('notifications.count');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllRead');
});

// 他ユーザーのプロフィール（最後に配置）
Route::get('/profile/{user}', [ProfileController::class, 'showPublic'])->name('users.profile'); 
Route::get('/terms', fn() => inertia('TermsAndPrivacy'));
Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show'); 


require __DIR__.'/auth.php';

