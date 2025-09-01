<?php

namespace App\Http\Controllers;
use App\Http\Requests\PostRequest;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Models\Country;
use App\Models\Post;
use App\Models\Style;
use App\Models\Purpose;
use App\Models\Budget;

class PostController extends Controller
{
    /**
     * Display the post_creation view.
     */
     public function create(): Response
    {
        $user = auth()->id();
        return Inertia::render('Posts/Create', [
            'countries' => Country::all(['id', 'code', 'name']),
            'styles' => Style::all(['id', 'name']),
            'purposes' => Purpose::all(['id', 'name']),
            'budgets' => Budget::all(['id', 'min','max','label']),
        ]);
    }

     /**
     * Handle an incoming post_creation request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(PostRequest $request): RedirectResponse
    {
        // バリデーション結果を$validatedに代入
        $validated = $request->validated();

        // 投稿保存処理（user_idはログインユーザーから取得）
        $request->user()->posts()->create($validated);

        return redirect()->route('profile.show')->with('success', '投稿を作成しました');
    }

    /**
     * Display the post detail.
     */
    public function show(Post $post): Response
    {   //render(resources/js/Pages/Posts/Show.jsx)
        return Inertia::render('Posts/Show', [
            'post' => $post->load(['user', 'country', 'style', 'purpose', 'budget']),
        ]);
    }

    public function edit(Post $post): Response
    {
        return Inertia::render('Posts/Edit', [
            'post' => $post->load(['user', 'country', 'style', 'purpose', 'budget']),
        ]);
    }

    public function update(PostRequest $request, Post $post): RedirectResponse
    {
        $validated = $request->validated();
        $post->update($validated);
        return redirect()->route('posts.show', $post)->with('success', '投稿を更新しました');

    }
}