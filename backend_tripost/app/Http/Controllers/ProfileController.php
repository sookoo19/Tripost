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
        $user = auth()->user()->loadCount('posts');
        
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
                    'profile_image_url' => (
                        !empty($p->user->profile_image) &&
                        is_string($p->user->profile_image) &&
                        Storage::disk('s3')->exists($p->user->profile_image)
                    ) ? Storage::disk('s3')->url($p->user->profile_image) : null,
                ],
                'photos_urls' => collect($p->photos ?? [])->map(function($q){
                        if (empty($q) || !is_string($q)) return null;
                        return Storage::disk('s3')->exists($q) ? Storage::disk('s3')->url($q) : null;
                    })->filter()->values()->all(),
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
                'profile_image_url' => (
                    !empty($user->profile_image) &&
                    is_string($user->profile_image) &&
                    Storage::disk('s3')->exists($user->profile_image)
                ) ? Storage::disk('s3')->url($user->profile_image) : null,
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
        $user = $request->user();
        
        // プロフィール画像の処理を先に行う
        if ($request->hasFile('profile_image')) {
            // 古い画像が存在する場合は削除 (s3)
            if ($user->profile_image && is_string($user->profile_image) && Storage::disk('s3')->exists($user->profile_image)) {
                Storage::disk('s3')->delete($user->profile_image);
            }

            // 新しい画像を保存（s3）
            $path = $request->file('profile_image')->store('profile_images', 's3');

            // DBには「パス」のみ保存
            $user->profile_image = $path;
        }
        
        // その他のフィールドを更新（profile_imageは上書きされない）
        $validated = $request->validated();
        unset($validated['profile_image']); // profile_imageキーを除外
        $user->fill($validated);
        $user->save();

        // フロントで未選択(キーが無い)でも空配列をデフォルトにして必ず同期する
        // これにより未選択時は既存データをクリアできます
        $codes = $request->input('visited_countries', []);
        $countryIds = Country::whereIn('code', $codes)->pluck('id')->toArray();
        $user->visitedCountries()->sync($countryIds);

        return Redirect::route('profile.show');
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
        // 投稿数を DB 側で取得しておく（$user->posts_count が使えるようになる）
        $user->loadCount('posts')->load('visitedCountries');

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
                    'profile_image_url' => (
                        !empty($p->user->profile_image) &&
                        is_string($p->user->profile_image) &&
                        Storage::disk('s3')->exists($p->user->profile_image)
                    ) ? Storage::disk('s3')->url($p->user->profile_image) : null,
                ],
                'photos_urls' => collect($p->photos ?? [])->map(function($q){
                        if (empty($q) || !is_string($q)) return null;
                        return Storage::disk('s3')->exists($q) ? Storage::disk('s3')->url($q) : null;
                    })->filter()->values()->all(),
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
