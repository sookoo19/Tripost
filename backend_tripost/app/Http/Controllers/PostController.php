<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostRequest;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\Post;
use App\Models\Country;
use App\Models\User;
use App\Models\Style;
use App\Models\Purpose;
use App\Models\Budget;
use App\Models\Follow;

class PostController extends Controller
{

    public function index(Request $request)
    {
        // 基本のクエリ：最新順、ユーザーを事前ロード
        $query = Post::with('user')->withCount('likes')->latest();


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
                'likes_count' => $post->likes_count,
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


        return redirect()->route('profile.show', $post);   
    }

    /**
     * Display the post detail.
     */
    public function show(Post $post)
    {
        // 投稿情報と関連データのロード
        $post->load(['user', 'comments.user']);
        $post->loadCount('likes');
        
        // 投稿のユーザー情報
        $user = $post->user;
        
        // 現在のユーザーがログインしている場合、フォロー状態を確認
        if (auth()->check()) {
            $currentUser = auth()->user();
            // いいね状態
            $post->is_liked = $post->likes()->where('user_id', $currentUser->id)->exists();
            // フォロー状態
            $user->is_followed = $currentUser->following()->where('users.id', $user->id)->exists();
        } else {
            $post->is_liked = false;
            $user->is_followed = false;
        }

        return Inertia::render('Posts/Show', [
            'post' => $post,
            'user' => $user,
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
        // 基本のクエリ：ユーザーを事前ロード
        $query = Post::with('user')->withCount('likes');

        // ここで全検索条件を確実に取得する（空でも値として保持する）
        $filters = [
            'keyword' => $request->input('keyword', ''),
            'country_id' => $request->input('country_id', ''),
            'period_from' => $request->input('period_from', ''),
            'period_to' => $request->input('period_to', ''),
            'days' => $request->input('days', ''),
            'style_id' => $request->input('style_id', ''),
            'purpose_id' => $request->input('purpose_id', ''),
            'budget_min' => $request->input('budget_min', ''),
            'budget_max' => $request->input('budget_max', ''),
            'sort' => $request->input('sort', 'latest'),
        ];

        // 検索パラメータの処理
        if (!empty($filters['keyword'])) {
            // カンマ、読点、空白などで分割できるように正規表現を改善
            $keywords = preg_split('/[,、]+/u', trim($filters['keyword']));
            $keywords = array_filter($keywords, fn($v) => $v !== '');
            
            foreach ($keywords as $keyword) {
                $keyword = trim($keyword); // 各キーワードの前後の空白を削除
                if (empty($keyword)) continue; // 空のキーワードはスキップ
                
                $query->where(function ($q) use ($keyword) {
                    $q->where('title', 'like', '%' . $keyword . '%')
                      ->orWhere('subtitle', 'like', '%' . $keyword . '%')
                      ->orWhere('description', 'like', '%' . $keyword . '%')
                      ->orWhere('region', 'like', '%' . $keyword . '%')
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

        if (!empty($filters['country_id'])) {
            $query->where('country_id', $filters['country_id']);
        }

        if (!empty($filters['period_from']) && !empty($filters['period_to'])) {
            $query->whereBetween('created_at', [$filters['period_from'] . '-01', $filters['period_to'] . '-31']);
        } elseif (!empty($filters['period_from'])) {
            $query->where('created_at', '>=', $filters['period_from'] . '-01');
        } elseif (!empty($filters['period_to'])) {
            $query->where('created_at', '<=', $filters['period_to'] . '-31');
        }

        if (!empty($filters['days'])) {
            $query->where('days', $filters['days']);
        }

        if (!empty($filters['style_id'])) {
            $query->where('style_id', $filters['style_id']);
        }

        if (!empty($filters['purpose_id'])) {
            $query->where('purpose_id', $filters['purpose_id']);
        }

        if (!empty($filters['budget_min']) || !empty($filters['budget_max'])) {
            $query->whereHas('budget', function ($q) use ($filters) {
                if (!empty($filters['budget_min'])) {
                    $q->where('min', '>=', $filters['budget_min']);
                }
                if (!empty($filters['budget_max'])) {
                    $q->where('max', '<=', $filters['budget_max']);
                }
            });
        }

        // 並び替えとページネーション（両方を先に取得）
        $queryForLatest = (clone $query);
        $queryForLikes = (clone $query);

        // クエリビルダを実行して結果を取得
        $postsLatest = $queryForLatest->latest()->paginate(8);
        $postsLatest->appends($filters); // 重要: クエリパラメータをページネーションリンクに追加

        $postsLikes = $queryForLikes->orderBy('likes_count', 'desc')->orderBy('created_at', 'desc')->paginate(8);
        $postsLikes->appends($filters); // 重要: クエリパラメータをページネーションリンクに追加

        // データ変換ロジック
        $postsLatestProcessed = $postsLatest->through(function (Post $post) {
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
                'likes_count' => $post->likes_count,
            ];
        });

        $postsLikesProcessed = $postsLikes->through(function (Post $post) {
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
                'likes_count' => $post->likes_count,
            ];
        });

        // 表示用はリクエストの sort に合わせる
        $posts = $filters['sort'] === 'likes' ? $postsLikesProcessed : $postsLatestProcessed;

        return Inertia::render('Posts/SearchIndex', [
            'posts' => $posts,
            'posts_latest' => $postsLatestProcessed,
            'posts_likes' => $postsLikesProcessed,
            'filters' => $filters, // 確実に全フィルターを渡す
            'countries' => Country::all(['id', 'name']),
            'styles' => Style::all(['id', 'name']),
            'purposes' => Purpose::all(['id', 'name']),
            'budgets' => Budget::all(['id', 'label', 'min', 'max']),
        ]);
    }

}