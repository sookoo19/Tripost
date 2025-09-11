<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Post;

class MapController extends Controller
{
    public function show(Request $request)
    {
        $posts = [];

        if (Auth::check()) {
            $user = Auth::user();
            // 必要なリレーションをロードして取得（軽量化のため必要カラムのみ）
            $postsQuery = Post::where('user_id', $user->id)
                ->with(['user'])
                ->latest();

            $posts = $postsQuery->get()->map(function (Post $p) {
                // 必要な項目だけ返す（タイトルと trip_plan）
                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'trip_plan' => $p->trip_plan,
                ];
            })->values()->all();
        }

        return Inertia::render('Map', [
            'posts' => $posts, // null または Collection（配列化されて渡る）
        ]);
    }
}