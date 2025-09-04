<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Country;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function show(Request $request): Response
    {
        $user = auth()->user();
        return Inertia::render('Profile/Show', [
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
        // 必要なリレーションをロードして渡す（必要に応じて調整）
        $user->load(['posts']);
        return Inertia::render('Profile/ShowPublic', [
            'user' => $user,
        ]);
    }
}
