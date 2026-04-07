<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\Like;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PostLikeController extends Controller
{
    public function store(Post $post, Request $request)
    {
        $user = $request->user();
        
        // firstOrCreate を使って重複を防ぐ
        $created = Like::firstOrCreate(
            ['post_id' => $post->id, 'user_id' => $user->id]
        )->wasRecentlyCreated; // 新規作成されたかどうかを取得
        
        // 新規いいねの場合のみ通知を作成
        if ($created && $post->user_id !== $user->id) {
            Notification::create([
                'user_id' => $post->user_id, // 投稿者に通知
                'actor_id' => $user->id,     // いいねしたユーザー
                'type' => 'like',
                'notifiable_id' => $post->id,
                'notifiable_type' => Post::class,
            ]);
        }

        $post = $post->fresh()->load('user')->loadCount('likes')->load('comments.user');
        
        // いいね状態を明示的に設定
        $post->is_liked = true;
        
        // 純粋なAjaxリクエストの場合のみJSONレスポンスを返す
        if ($request->wantsJson() && !$request->header('X-Inertia')) {
            return response()->json([
                'post' => $post,
                'likes_count' => $post->likes_count,
                'is_liked' => true
            ]);
        }

        // Inertiaリクエストまたは通常のリクエストの場合
        return Inertia::render('Posts/Show', [
            'post' => $post,
            'user' => $post->user,
        ]);
    }

    public function destroy(Post $post, Request $request)
    {
        $user = $request->user();
        $post->likes()->where('user_id', $user->id)->delete();

        $post = $post->fresh()->load('user')->loadCount('likes')->load('comments.user');
        
        // 純粋なAjaxリクエストの場合のみJSONレスポンスを返す
        if ($request->wantsJson() && !$request->header('X-Inertia')) {
            return response()->json([
                'post' => $post,
                'likes_count' => $post->likes_count,
                'is_liked' => false
            ]);
        }

        // Inertiaリクエストまたは通常のリクエストの場合
        return Inertia::render('Posts/Show', [
            'post' => $post,
            'user' => $post->user,
        ]);
    }
}
