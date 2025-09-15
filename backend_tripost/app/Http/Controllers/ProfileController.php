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
            ->with('user')
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
            ];
        });
        $posts->setCollection($transformed);

        return Inertia::render('Profile/Show', [
            'user' => [
                'id' => $user->id,
                'displayid' => $user->displayid,
                'name' => $user->name,
                'profile_image' => $user->profile_image,
                'bio' => $user->bio,
                // ここで国コード配列を渡す
                'visited_countries' => $user->visitedCountries->pluck('code')->toArray(),
                'posts_count' => $user->posts_count,
                // フォロー数・フォロワー数を追加
                'followers_count' => $user->followers_count,
                'following_count' => $user->following_count,
            ],
            'countries' => Country::all(['id', 'code', 'name', 'image']),
            'posts' => $posts
        ]);
    }

    public function edit(Request $request): Response
        {
            $user = auth()->user()->load('visitedCountries');

            return Inertia::render('Profile/Edit', [
            'user' => [
                'displayid' => $user->displayid,
                'name' => $user->name,
                'profile_image' => $user->profile_image,
                'bio' => $user->bio,
                // ここで国コード配列を渡す
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
      
        //バリデーションはProfileUpdateRequest内
        $user = $request->user();
        $user->fill($request->validated());
        $user->save();

        if ($request->has('visited_countries')) {
            $countryIds = Country::whereIn('code', $request->input('visited_countries', []))->pluck('id')->toArray();
            $user->visitedCountries()->sync($countryIds);
        }

         if ($request->hasFile('profile_image')) {
            // パスだけ保存される
            $path = $request->file('profile_image')->store('profile_images', 'public');

            // DBには「パス」のみ保存
            $user->profile_image = $path; // ←profile_imageカラムに保存
            $user->save();
        }

        return Redirect::route('profile.show');
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

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    public function showPublic(User $user)
    {
        // 必要なリレーションをロードして渡す
        // 投稿数を DB 側で取得しておく（$user->posts_count が使えるようになる）
        $user->loadCount('posts')->load('visitedCountries');

        // フォロー数・フォロワー数を取得
        $user->followers_count = $user->followerRelations()->count();
        $user->following_count = $user->followingRelations()->count();
        
        // 現在のユーザーがこのユーザーをフォローしているかチェック
        $user->is_followed = false;
        if (Auth::check()) {
            $user->is_followed = Follow::where('following', Auth::id())
                                  ->where('followed', $user->id)
                                  ->exists();
        }

        // ユーザーの投稿をページネーションで取得（必要に応じて件数を変更）
        $posts = Post::where('user_id', $user->id)
            ->with('user')
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
            ],
            'countries' => Country::all(['id', 'code', 'name', 'image']),
            'posts' => $posts,
        ]);
    }

    public function get_user($user_id){

        $user = User::with('following')->with('followed')->findOrFail($user_id);
        return response()->json($user);
    }
}
