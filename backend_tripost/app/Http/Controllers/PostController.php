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

    public function searchPosts(): Response
    {
        return Inertia::render('Posts/Search', [
            'countries' => Country::all(['id', 'code', 'name']),
            'styles' => Style::all(['id', 'name']),
            'purposes' => Purpose::all(['id', 'name']),
            'budgets' => Budget::all(['id', 'min','max','label']),
            ]
        );
    }

    public function searchIndex(Request $request)
    {
        // 基本のクエリ：最新順、ユーザーを事前ロード
        $query = Post::with('user')->latest();

        // 検索パラメータの処理
        if ($request->filled('keyword')) {
            // カンマ、読点、空白などで分割できるように正規表現を改善
            $keywords = preg_split('/[,、]+/u', trim($request->keyword));
            $keywords = array_filter($keywords, fn($v) => $v !== '');
            
            foreach ($keywords as $keyword) {
                $keyword = trim($keyword); // 各キーワードの前後の空白を削除
                if (empty($keyword)) continue; // 空のキーワードはスキップ
                
                $query->where(function ($q) use ($keyword) {
                    $q->where('title', 'like', '%' . $keyword . '%')
                      ->orWhere('subtitle', 'like', '%' . $keyword . '%')
                      ->orWhere('description', 'like', '%' . $keyword . '%')
                      ->orWhere('region', 'like', '%' . $keyword . '%')
                      // trip_plan(JSON) の中身を文字列化して部分一致検索
                      // orWhereJsonContains は JSON の「完全一致」や要素単位の一致を期待する際に使うため、部分一致検索には向きません。
                      ->orWhereRaw("CAST(trip_plan AS CHAR) LIKE ?", ['%' . $keyword . '%'])
                      ->orWhereHas('country', function ($subQ) use ($keyword) {
                          $subQ->where('name', 'like', '%' . $keyword . '%');
                      })
                      ->orWhereHas('style', function ($subQ) use ($keyword) {
                          $subQ->where('name', 'like', '%' . $keyword . '%');
                      })
                      ->orWhereHas('purpose', function ($subQ) use ($keyword) {
                          $subQ->where('name', 'like', '%' . $keyword . '%');
                      })
                      ->orWhereHas('budget', function ($subQ) use ($keyword) {
                          $subQ->where('label', 'like', '%' . $keyword . '%');
                      });
                });
            }
        }

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->country_id);
        }

        if ($request->filled('period_from') && $request->filled('period_to')) {
            $query->whereBetween('created_at', [$request->period_from . '-01', $request->period_to . '-31']); // 月範囲を日付に変換
        } elseif ($request->filled('period_from')) {
            $query->where('created_at', '>=', $request->period_from . '-01');
        } elseif ($request->filled('period_to')) {
            $query->where('created_at', '<=', $request->period_to . '-31');
        }

        if ($request->filled('days')) {
            $query->where('days', $request->days);
        }

        if ($request->filled('style_id')) {
            $query->where('style_id', $request->style_id);
        }

        if ($request->filled('purpose_id')) {
            $query->where('purpose_id', $request->purpose_id);
        }

        if ($request->filled('budget_min') || $request->filled('budget_max')) {
            $query->whereHas('budget', function ($q) use ($request) {
                if ($request->filled('budget_min')) {
                    $q->where('min', '>=', $request->budget_min);
                }
                if ($request->filled('budget_max')) {
                    $q->where('max', '<=', $request->budget_max);
                }
            });
        }

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

        // クエリ（フォーム送信された条件）を filters として渡す
        $filters = $request->only([
            'keyword',
            'country_id',
            'period_from',
            'period_to',
            'days',
            'style_id',
            'purpose_id',
            'budget_min',
            'budget_max',
        ]);

        return Inertia::render('Posts/SearchIndex', [
            'posts' => $posts,
            'filters' => $filters,
            // 表示のために id -> name 参照テーブルも渡す（軽量化のため必要項目のみ）
            'countries' => Country::all(['id', 'name']),
            'styles' => Style::all(['id', 'name']),
            'purposes' => Purpose::all(['id', 'name']),
            'budgets' => Budget::all(['id', 'label', 'min', 'max']),
        ]);
    }

}