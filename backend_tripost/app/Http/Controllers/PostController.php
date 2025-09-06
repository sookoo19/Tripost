<?php

namespace App\Http\Controllers;
use App\Http\Requests\PostRequest;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Post;
use App\Models\Country;
use App\Models\User;
use App\Models\Style;
use App\Models\Purpose;
use App\Models\Budget;

class PostController extends Controller
{

    public function index(Request $request)
    {
        // 基本のクエリ：最新順、ユーザーを事前ロード
        $query = Post::with('user')->latest();

        // ページネーション（例：8件／ページ）
        $posts = $query->paginate(8)->through(function (Post $post) {
            $user = $post->user;
            return [
                'id' => $post->id,
                'title' => $post->title,
                'subtitle' => $post->subtitle,
                'created_at' => $post->created_at->toDateTimeString(),
                'user' => [
                    'id' => $user->id,
                    'displayid' => $user->displayid,
                    'profile_image_url' => $user->profile_image ? Storage::url($user->profile_image) : null,
                ],
                'photos' => $post->photos ?? [],
                'photos_urls' => collect($post->photos ?? [])->map(fn($p) => Storage::url($p))->all(),
            ];
        });

        return Inertia::render('Posts/Index', [
            'posts' => $posts,
        ]);
    }
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
        $data = $request->validated();
        $post = auth()->user()->posts()->create($data);

         if ($request->hasFile('photos')) {
        $paths = [];
        foreach ($request->file('photos') as $file) {
            if (!$file) continue;
            $paths[] = $file->store('posts_photos', 'public');
            if (count($paths) >= 8) break;
        }
        if (!empty($paths)) {
            $post->photos = $paths;
            $post->save();
        }
    }


        return redirect()->route('posts.show', $post);   
    }

    /**
     * Display the post detail.
     */
    public function show(Post $post): Response
    {
        $post->user->profile_image_url = $post->user->profile_image
            ? Storage::url($post->user->profile_image)
            : null;
        //render(resources/js/Pages/Posts/Show.jsx)
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

        $existing = is_array($post->photos) ? $post->photos : [];

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                if (!$file) continue;
                $existing[] = $file->store('posts_photos', 'public');
                if (count($existing) >= 8) break;
            }
            $post->photos = array_slice($existing, 0, 8);
            $post->save();
        }
        return redirect()->route('posts.show', $post)->with('success', '投稿を更新しました');

    }
}