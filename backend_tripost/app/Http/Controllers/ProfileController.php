<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Country;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use App\Models\Post;
use App\Models\Follow;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function show(Request $request): Response
    {
        $user = auth()->user()->loadCount([
            'posts as posts_count' => fn($q) => $q->where('share_scope', '公開'),
        ]);
        
        // フォロー数・フォロワー数を取得
        $user->followers_count = $user->followerRelations()->count();
        $user->following_count = $user->followingRelations()->count();
        
        // ユーザーの投稿をページネーションで取得（必要に応じて件数を変更）
        $posts = Post::where('user_id', $user->id)
            ->where('share_scope', '公開')
            ->with('user')
            ->withCount('likes')
            ->latest()
            ->paginate(8);

            // フロントに送るデータだけに変換（画像URLなどを整形）
        $transformed = $posts->getCollection()->map(function (Post $p) {
            return [
                'id' => $p->id,
                'title' => $p->title,
                'subtitle' => $p->subtitle,
                'created_at' => $p->created_at->toDateTimeString(),
                'user' => [
                    'id' => $p->user->id,
                    'displayid' => $p->user->displayid,
                    'profile_image_url' => $p->user->profile_image ? Storage::url($p->user->profile_image) : null,
                ],
                'photos_urls' => collect($p->photos ?? [])->map(fn($q) => Storage::url($q))->all(),
                'likes_count' => $p->likes_count,
            ];
        });
        $posts->setCollection($transformed);

        return Inertia::render('Profile/Show', [
            'user' => [
                'id' => $user->id,
                'displayid' => $user->displayid,
                'name' => $user->name,
                'profile_image' => $user->profile_image,
                'profile_image_url' => $user->profile_image ? Storage::url($user->profile_image) : null, // 追加
                'bio' => $user->bio,
                // ここで国コード配列を渡す
                'visited_countries' => $user->visitedCountries->pluck('code')->toArray(),
                'posts_count' => $user->posts_count,
                // フォロー数・フォロワー数を追加
                'followers_count' => $user->followers_count,
                'following_count' => $user->following_count,

            ],
            'countries' => Country::all(['id', 'code', 'name', 'image']),
            'posts' => $posts,
        ]);
    }

    public function edit(Request $request): Response
{
    $user = auth()->user()->load('visitedCountries');
    
    // 必要なユーザー情報をすべて含める
    return Inertia::render('Profile/Edit', [
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'profile_image' => $user->profile_image,
            'profile_image_url' => $user->profile_image ? Storage::url($user->profile_image) : null, // 追加
            'bio' => $user->bio,
            'visited_countries' => $user->visitedCountries->pluck('code')->toArray(),
        ],
        'countries' => Country::all(['id', 'code', 'name', 'image']),
    ]);
}

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        try {
            $user = $request->user();
            
            // 画像処理を先に実行
            if ($request->hasFile('profile_image')) {
                // 旧画像パスを先に取得
                $old = $user->profile_image;
                \Log::info('Profile update - old image', ['old' => $old]);
                
                // S3 に保存（公開アクセス権限を明示的に設定）
                $path = $request->file('profile_image')->storePublicly('profile_images', 's3');
                \Log::info('Profile update - new image saved', ['new' => $path]);
                
                // 空の文字列や無効な値をチェックするように修正
                if ($old && is_string($old) && strlen($old) > 0) {
                    $oldExists = Storage::disk('s3')->exists($old);
                    \Log::info('Profile update - exists check', ['old_exists' => $oldExists]);
                    
                    // 旧画像を削除（S3から即時削除）
                    if ($oldExists) {
                        \Log::info('Deleting old image from S3', ['old' => $old]);
                        Storage::disk('s3')->delete($old);
                        \Log::info('Old image deleted');
                    }
                } else {
                    \Log::info('Old image path is invalid', ['old' => $old]);
                }
                
                // 新しいパスを設定
                $user->profile_image = $path;
            }
            
            // その他のフィールドを更新
            $user->fill($request->validated());
            $user->save();

            // 訪問国の同期
            $codes = $request->input('visited_countries', []);
            $countryIds = Country::whereIn('code', $codes)->pluck('id')->toArray();
            $user->visitedCountries()->sync($countryIds);

            return Redirect::route('profile.show');
        } catch (\Exception $e) {
            \Log::error('Profile update error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Redirect::back()->withErrors([
                'error' => 'プロフィールの更新中にエラーが発生しました。'
            ]);
        }
    }

    public function destroy_confirm (Request $request): Response
    {

        return Inertia::render('Profile/Destroy');
            
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();


        $user->posts()->delete();
        $user->likes()->delete(); // いいねを削除
        // follows()/followers() が User モデルに存在しないため、Follow モデルで直接削除する
        \App\Models\Follow::where('following', $user->id)
            ->orWhere('followed', $user->id)
            ->delete();

        Auth::logout();
        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('auth/register')->with('success', 'アカウントを削除しました');
    }

    public function showPublic(User $user)
    {
        // 必要なリレーションをロードして渡す
        // 公開（share_scope = '公開'）の投稿のみをカウントして posts_count を取得
        $user->loadCount([
            'posts as posts_count' => fn($q) => $q->where('share_scope', '公開'),
        ])->load('visitedCountries');

        // フォロー数・フォロワー数を取得
        $user->followers_count = $user->followerRelations()->count();
        $user->following_count = $user->followingRelations()->count();
        
        // 表示ユーザーのフォロー状態を判定
        $user->is_followed = false;
        $user->follow_you = false;
        if (Auth::check()) {
            $authId = Auth::id();
            $user->is_followed = Follow::where('following', $authId)
                                       ->where('followed', $user->id)
                                       ->exists();
            $user->follow_you = Follow::where('following', $user->id)
                                      ->where('followed', $authId)
                                      ->exists();
        }

        // ユーザーの投稿をページネーションで取得（必要に応じて件数を変更）
        $posts = Post::where('user_id', $user->id)
            ->where('share_scope', '公開')
            ->with('user')
            ->withCount('likes')
            ->latest()
            ->paginate(8);

            // フロントに送るデータだけに変換（画像URLなどを整形）
        $transformed = $posts->getCollection()->map(function (Post $p) {
            return [
                'id' => $p->id,
                'title' => $p->title,
                'subtitle' => $p->subtitle,
                'created_at' => $p->created_at->toDateTimeString(),
                'user' => [
                    'id' => $p->user->id,
                    'displayid' => $p->user->displayid,
                    'profile_image_url' => $p->user->profile_image ? Storage::url($p->user->profile_image) : null,
                ],
                'photos_urls' => collect($p->photos ?? [])->map(fn($q) => Storage::url($q))->all(),
                'likes_count' => $p->likes_count,
            ];
        });
        $posts->setCollection($transformed);

        return Inertia::render('Profile/ShowPublic', [
            'user' => [
                'id' => $user->id,
                'displayid' => $user->displayid,
                'name' => $user->name,
                'profile_image' => $user->profile_image,
                'bio' => $user->bio,
                // ここで国コード配列を渡す
                'visited_countries' => $user->visitedCountries->pluck('code')->toArray(),
                // 必要なら投稿も簡素化して渡す
                'posts_count' => $user->posts_count,
                // フォロー数・フォロワー数・フォロー状態を追加
                'followers_count' => $user->followers_count,
                'following_count' => $user->following_count,
                'is_followed' => $user->is_followed,
                'follow_you' => $user->follow_you,
            ],
            'countries' => Country::all(['id', 'code', 'name', 'image']),
            'posts' => $posts,
        ]);
    }
}
