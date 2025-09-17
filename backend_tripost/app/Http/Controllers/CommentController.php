<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\Comment;
use Inertia\Inertia;

class CommentController extends Controller
{
    public function store(Post $post, Request $request)
    {
        $request->validate(['body' => 'required|string|max:2000']);

        $comment = $post->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $request->input('body'),
        ]);

        $comment->load('user');

        // 最新の post を取得して Inertia レスポンスで返す
        $post = $post->fresh()->load('user')->loadCount('likes')->load('comments.user');

        return Inertia::render('Posts/Show', [
            'post' => $post,
            'auth' => ['user' => $request->user()],
        ]);
    }
}
