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
use App\Models\Like; // 追加

class PostController extends Controller
{

    public function index(Request $request)
    {
        $filter = $request->query('filter', '');
        $query = Post::with('user')->withCount('likes')->latest();
        $query->where('share_scope', '公開');

        if ($filter === 'following') {
            if (auth()->check()) {
                $followingIds = Follow::where('following', auth()->id())->pluck('followed')->toArray();
                $query->whereIn('user_id', $followingIds ?: [0]);
            } else {
                $query->whereRaw('0 = 1');
            }
        }

        // ヘルパー: パスから公開 URL を安全に解決（S3 優先）
        $resolveUrl = function ($p) {
            if (!is_string($p)) return null;
            $p = trim($p);
            if ($p === '') return null;
            // フルURLならそのまま返す
            if (preg_match('/^https?:\\/\\//', $p)) return $p;

            try {
                if (Storage::disk('s3')->exists($p)) {
                    return Storage::disk('s3')->url($p);
                }
            } catch (\Throwable $e) {
                \Log::warning('S3 exists check failed', ['path' => $p, 'error' => $e->getMessage()]);
            }

            try {
                if (Storage::exists($p)) {
                    return Storage::url($p);
                }
            } catch (\Throwable $e) {
                \Log::warning('Storage exists check failed', ['path' => $p, 'error' => $e->getMessage()]);
            }

            return null;
        };

        $posts = $query->paginate(8)->appends($request->query())->through(function (Post $post) use ($resolveUrl) {
            $user = $post->user;
            $userData = $user ? [
                'id' => $user->id,
                'displayid' => $user->displayid,
                'profile_image_url' => (!empty($user->profile_image) && is_string($user->profile_image))
                    ? $resolveUrl($user->profile_image)
                    : null,
            ] : null;

            $photos = $post->photos ?? [];
            $photos_urls = collect(is_array($photos) ? $photos : [])
                ->map(function($p) use ($resolveUrl) {
                    return $resolveUrl($p);
                })
                ->filter()
                ->values()
                ->all();

            return [
                'id' => $post->id,
                'title' => $post->title,
                'subtitle' => $post->subtitle,
                'created_at' => $post->created_at->toDateTimeString(),
                'user' => $userData,
                'photos' => $photos,
                'photos_urls' => $photos_urls,
                'likes_count' => $post->likes_count,
            ];
        });

        return Inertia::render('Posts/Index', [
            'posts' => $posts,
            'filter' => $filter,
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
            $paths[] = $file->store('posts_photos');
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
        $post->load(['user', 'comments.user']);
        $post->loadCount('likes');

        $user = $post->user;

        if ($user && !empty($user->profile_image) && is_string($user->profile_image)) {
            try {
                $user->profile_image_url = Storage::disk('s3')->exists($user->profile_image)
                    ? Storage::disk('s3')->url($user->profile_image)
                    : (Storage::exists($user->profile_image) ? Storage::url($user->profile_image) : null);
            } catch (\Throwable $e) {
                \Log::warning('profile_image url resolve failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                $user->profile_image_url = null;
            }
        } else {
            $user->profile_image_url = null;
        }

        // photos_urls を安全に付与（S3 優先）
        $resolveUrl = function ($p) {
            if (!is_string($p)) return null;
            $p = trim($p);
            if ($p === '') return null;
            if (preg_match('/^https?:\\/\\//', $p)) return $p;
            try {
                if (Storage::disk('s3')->exists($p)) {
                    return Storage::disk('s3')->url($p);
                }
            } catch (\Throwable $e) {
                \Log::warning('S3 exists check failed in show', ['path' => $p, 'error' => $e->getMessage()]);
            }
            try {
                if (Storage::exists($p)) {
                    return Storage::url($p);
                }
            } catch (\Throwable $e) {
                \Log::warning('Storage exists check failed in show', ['path' => $p, 'error' => $e->getMessage()]);
            }
            return null;
        };

        $post->photos_urls = collect($post->photos ?? [])->map(function($p) use ($resolveUrl) {
            return $resolveUrl($p);
        })->filter()->values()->all();

        if (auth()->check()) {
            $currentUser = auth()->user();
            $post->is_liked = $post->likes()->where('user_id', $currentUser->id)->exists();
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
        // S3 優先で公開 URL を安全に解決するヘルパー
        $resolveUrl = function ($p) {
            if (!is_string($p)) return null;
            $p = trim($p);
            if ($p === '') return null;
            if (preg_match('/^https?:\\/\\//', $p)) return $p;
            try {
                if (Storage::disk('s3')->exists($p)) {
                    return Storage::disk('s3')->url($p);
                }
            } catch (\Throwable $e) {
                \Log::warning('S3 exists check failed (edit)', ['path' => $p, 'error' => $e->getMessage()]);
            }
            try {
                if (Storage::exists($p)) {
                    return Storage::url($p);
                }
            } catch (\Throwable $e) {
                \Log::warning('Storage exists check failed (edit)', ['path' => $p, 'error' => $e->getMessage()]);
            }
            return null;
        };

        $post = $post->load(['user', 'country', 'style', 'purpose', 'budget']);
        $post->photos_urls = collect($post->photos ?? [])->map(function($p) use ($resolveUrl) {
            return $resolveUrl($p);
        })->filter()->values()->all();

        return Inertia::render('Posts/Edit', [
            'countries' => Country::all(['id', 'code', 'name']),
            'styles' => Style::all(['id', 'name']),
            'purposes' => Purpose::all(['id', 'name']),
            'budgets' => Budget::all(['id', 'min','max','label']),
            'post' => $post,
        ]);
    }

    public function update(PostRequest $request, Post $post): RedirectResponse
    {
        $validated = $request->validated();
        $post->update($validated);

        // 新しい写真を先にアップロードし、アップロード成功時に旧写真を削除して差し替える（即時削除）
        $newPhotoPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                if (!$file || !$file->isValid()) continue;
                $newPhotoPaths[] = $file->store('posts_photos');
                if (count($newPhotoPaths) >= 8) break;
            }

            if (!empty($newPhotoPaths)) {
                // 旧写真を削除（S3）
                $oldPhotos = $post->photos ?? [];
                if (!empty($oldPhotos) && is_array($oldPhotos)) {
                    foreach ($oldPhotos as $path) {
                        if (Storage::exists($path)) {
                            Storage::delete($path);
                        }
                    }
                }
                // 差し替え保存
                $post->photos = $newPhotoPaths;
                $post->save();
            }
        }

        // 「編集した日時で並べたい」場合は created_at を更新する
        // created_at のみを上書きしたいので timestamps を一時的に無効化して保存
        $post->timestamps = false;
        $post->created_at = now();
        $post->save();
        $post->timestamps = true;

        return redirect()->route('posts.draft', $post)->with('success', '投稿を更新しました');
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
        $query->where('share_scope', '公開');

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
            $userData = $user ? [
                'id' => $user->id,
                'displayid' => $user->displayid,
                'profile_image_url' => (!empty($user->profile_image) && is_string($user->profile_image))
                    ? Storage::url($user->profile_image)
                    : null,
            ] : null;
            
            $photos = $post->photos ?? [];
            $photos_urls = collect(is_array($photos) ? $photos : [])
                ->map(function($p) {
                    return (!empty($p) && is_string($p)) ? Storage::url($p) : null;
                })
                ->filter()
                ->values()
                ->all();
            
            return [
                'id' => $post->id,
                'title' => $post->title,
                'subtitle' => $post->subtitle,
                'created_at' => $post->created_at->toDateTimeString(),
                'user' => $userData,
                'photos' => $photos,
                'photos_urls' => $photos_urls,
                'likes_count' => $post->likes_count,
            ];
        });

        $postsLikesProcessed = $postsLikes->through(function (Post $post) {
            $user = $post->user;
            $userData = $user ? [
                'id' => $user->id,
                'displayid' => $user->displayid,
                'profile_image_url' => (!empty($user->profile_image) && is_string($user->profile_image))
                    ? Storage::url($user->profile_image)
                    : null,
            ] : null;
            
            $photos = $post->photos ?? [];
            $photos_urls = collect(is_array($photos) ? $photos : [])
                ->map(function($p) {
                    return (!empty($p) && is_string($p)) ? Storage::url($p) : null;
                })
                ->filter()
                ->values()
                ->all();
            
            return [
                'id' => $post->id,
                'title' => $post->title,
                'subtitle' => $post->subtitle,
                'created_at' => $post->created_at->toDateTimeString(),
                'user' => $userData,
                'photos' => $photos,
                'photos_urls' => $photos_urls,
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

    public function draft(Request $request)
    {
        $user = auth()->user()->loadCount('posts');
        $query = Post::where('user_id', $user->id)->with('user')->latest();
        $query->where('share_scope', '非公開')->whereIn('post_status', ['準備中', '旅行中']);

        // S3 優先で公開 URL を安全に解決するヘルパー
        $resolveUrl = function ($p) {
            if (!is_string($p)) return null;
            $p = trim($p);
            if ($p === '') return null;
            if (preg_match('/^https?:\\/\\//', $p)) return $p;

            try {
                if (Storage::disk('s3')->exists($p)) {
                    return Storage::disk('s3')->url($p);
                }
            } catch (\Throwable $e) {
                \Log::warning('S3 exists check failed (draft)', ['path' => $p, 'error' => $e->getMessage()]);
            }

            try {
                if (Storage::exists($p)) {
                    return Storage::url($p);
                }
            } catch (\Throwable $e) {
                \Log::warning('Storage exists check failed (draft)', ['path' => $p, 'error' => $e->getMessage()]);
            }

            return null;
        };

        // ページネーション + データ整形（photos_urls と user.profile_image_url を付与）
        $posts = $query->paginate(8)->through(function (Post $post) use ($resolveUrl) {
            $user = $post->user;
            $userData = $user ? [
                'id' => $user->id,
                'displayid' => $user->displayid,
                'profile_image_url' => (!empty($user->profile_image) && is_string($user->profile_image))
                    ? $resolveUrl($user->profile_image)
                    : null,
            ] : null;

            $photos = $post->photos ?? [];
            $photos_urls = collect(is_array($photos) ? $photos : [])
                ->map(fn($p) => $resolveUrl($p))
                ->filter()
                ->values()
                ->all();

            return [
                'id' => $post->id,
                'title' => $post->title,
                'subtitle' => $post->subtitle,
                'created_at' => $post->created_at->toDateTimeString(),
                'user' => $userData,
                'post_status' => $post->post_status,
                'photos' => $photos,
                'photos_urls' => $photos_urls,
            ];
        });

        return Inertia::render('Posts/Draft', [
            'posts' => $posts,
        ]);
    }

    public function unpublic(Request $request)
    {
         // 基本のクエリ：最新順、ユーザーを事前ロード
        $user = auth()->user()->loadCount('posts');
        $query = Post::where('user_id', $user->id)->with('user')->withCount('likes')->latest();
        $query->where('share_scope', '非公開')->where('post_status', '旅行済'); 


        // ページネーション（例：8件／ページ）
        $posts = $query->paginate(8)->through(function (Post $post) {
            $user = $post->user;
            $userData = $user ? [
                'id' => $user->id,
                'displayid' => $user->displayid,
                'profile_image_url' => (!empty($user->profile_image) && is_string($user->profile_image))
                    ? Storage::url($user->profile_image)
                    : null,
            ] : null;
            
            $photos = $post->photos ?? [];
            $photos_urls = collect(is_array($photos) ? $photos : [])
                ->map(function($p) {
                    return (!empty($p) && is_string($p)) ? Storage::url($p) : null;
                })
                ->filter()
                ->values()
                ->all();
            
            return [
                'id' => $post->id,
                'title' => $post->title,
                'subtitle' => $post->subtitle,
                'created_at' => $post->created_at->toDateTimeString(),
                'user' => $userData,
                'photos' => $photos,
                'photos_urls' => $photos_urls,
                'likes_count' => $post->likes_count,
            ];
        });

        return Inertia::render('Posts/Unpublic', [
            'posts' => $posts,
        ]);
    }

    public function mylikes(Request $request)
    {
        $userId = auth()->id();

        $likes = Like::where('user_id', $userId)
            ->with('post.user')
            ->orderBy('created_at', 'desc')
            ->paginate(8);

        // Like ページネータを通して posts 表示用に変換（Paginator を維持）
        $posts = $likes->through(function ($like) {
            $post = $like->post;
            if (! $post) return null;
            
            $user = $post->user;
            $userData = $user ? [
                'id' => $user->id,
                'displayid' => $user->displayid,
                'profile_image_url' => (!empty($user->profile_image) && is_string($user->profile_image))
                    ? Storage::url($user->profile_image)
                    : null,
            ] : null;
            
            $photos = $post->photos ?? [];
            $photos_urls = collect(is_array($photos) ? $photos : [])
                ->map(function($p) {
                    return (!empty($p) && is_string($p)) ? Storage::url($p) : null;
                })
                ->filter()
                ->values()
                ->all();
            
            return [
                'id' => $post->id,
                'title' => $post->title,
                'subtitle' => $post->subtitle,
                'created_at' => $post->created_at->toDateTimeString(),
                'liked_at' => $like->created_at->toDateTimeString(),
                'user' => $userData,
                'photos_urls' => $photos_urls,
                'likes_count' => $post->likes()->count(),
            ];
        });

       

        return Inertia::render('Posts/MyLikes', [
            'posts' => $posts,
        ]);
    }

    public function update_share_scope(Request $request, Post $post)
    {
        $request->validate(['share_scope' => 'required|string']);

        $post->update($request->only('share_scope'));

        // Inertia/AJAX で扱いやすい JSON を返す
        return response()->json(['ok' => true, 'share_scope' => $post->share_scope]);
    }

    public function destroy(Request $request, Post $post)
    {
        // photos カラムの正規化：文字列(JSON) / 配列 / null を扱う
        $photos = $post->photos;
        if (is_string($photos)) {
            $decoded = json_decode($photos, true);
            if (is_array($decoded)) {
                $photos = $decoded;
            } else {
                $photos = [$photos];
            }
        } elseif (!is_array($photos)) {
            $photos = [];
        }

        foreach ($photos as $rawPath) {
            // 文字列でないものは無視
            if (!is_string($rawPath)) continue;
            $path = trim($rawPath);
            if ($path === '') continue;

            // フル URL の場合、S3 key を抽出する試み（失敗したらスキップ）
            if (preg_match('/^https?:\\/\\//', $path)) {
                try {
                    $parts = parse_url($path);
                    $candidate = $parts['path'] ?? null;
                    if ($candidate) {
                        // /bucket/key など先頭スラッシュを除去
                        $candidate = ltrim($candidate, '/');
                        $pathToCheck = $candidate;
                    } else {
                        continue;
                    }
                } catch (\Throwable $e) {
                    \Log::warning('Failed to parse URL for deletion', ['path' => $path, 'error' => $e->getMessage()]);
                    continue;
                }
            } else {
                $pathToCheck = $path;
            }

            try {
                // S3 優先で存在確認・削除、失敗はログだけ
                if (Storage::disk('s3')->exists($pathToCheck)) {
                    Storage::disk('s3')->delete($pathToCheck);
                    continue;
                }
            } catch (\Throwable $e) {
                \Log::warning('S3 delete check failed', ['post_id' => $post->id, 'path' => $pathToCheck, 'error' => $e->getMessage()]);
            }

            try {
                if (Storage::exists($pathToCheck)) {
                    Storage::delete($pathToCheck);
                }
            } catch (\Throwable $e) {
                \Log::warning('Local storage delete failed', ['post_id' => $post->id, 'path' => $pathToCheck, 'error' => $e->getMessage()]);
            }
        }

        try {
            $post->delete();
        } catch (\Throwable $e) {
            \Log::error('Post delete failed', ['post_id' => $post->id, 'error' => $e->getMessage()]);
            return response()->json(['ok' => false, 'message' => '投稿の削除に失敗しました'], 500);
        }

        return response()->json(['ok' => true]);
    }
}
