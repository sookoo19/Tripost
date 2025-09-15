<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Follow;//Followモデルをインポート
use Illuminate\Support\Facades\Auth; // Authファサードを読み込む
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class FollowController extends Controller
{
    //フォローする(中間テーブルをインサート)
    public function following(Request $request){

        //自分がフォローしているかどうか検索
        $check = Follow::where('following', Auth::id())->where('followed', $request->user_id);

        //検索結果が0(まだフォローしていない)場合のみフォローする
        if($check->count() == 0):
            $follow = new Follow;
            $follow->following = Auth::id();
            $follow->followed = $request->user_id;
            $follow->save();
            
            // Inertiaレスポンスに変更
            return redirect()->back()->with('message', 'フォローしました');
        endif;
        
        // エラーの場合もInertiaレスポンス
        return redirect()->back()->withErrors(['follow' => '既にフォローしています']);
    }

    //フォローを外す
    public function unfollowing(Request $request){

        //削除対象のレコードを検索して削除
        $unfollowing = Follow::where('following', Auth::id())->where('followed', $request->user_id)->delete();
        
        // Inertiaレスポンスに変更
        return redirect()->back()->with('message', 'フォローを解除しました');
    }

    public function following_index(User $user){ // ルートモデルバインディングでUserを取得
        // フォロー数・フォロワー数を取得（URLから渡されたユーザーのものを表示）
        $user->followers_count = $user->followerRelations()->count();
        $user->following_count = $user->followingRelations()->count();

        // 実際のフォロー中ユーザーを取得
        $followingUsers = $user->following()->get();

        // フロント用に整形
        $followingIndex = $followingUsers->map(function($u){
            return [
                'id' => $u->id,
                'displayid' => $u->displayid,
                'name' => $u->name,
                'profile_image_url' => $u->profile_image ? Storage::url($u->profile_image) : null,
            ];
        });

        return Inertia::render('Profile/Following', [
            'user' => $user, // URLから取得したユーザー情報
            'following_index' => $followingIndex,
        ]);
    }

    public function follower_index(User $user){ // ルートモデルバインディングでUserを取得
        // フォロー数・フォロワー数を取得（URLから渡されたユーザーのものを表示）
        $user->followers_count = $user->followerRelations()->count();
        $user->following_count = $user->followingRelations()->count();
        
        // 実際のフォロワーを取得
        $followerUsers = $user->followers()->get();
        
        // フロント用に整形するコードを追加
        $followerIndex = $followerUsers->map(function($u){
            // ユーザー情報を整形
            return [
                'id' => $u->id,
                'name' => $u->name,
                'displayid' => $u->displayid,
                'profile_image' => $u->profile_image ? Storage::url($u->profile_image) : null,
            ];
        });
        
        return Inertia::render('Profile/Follower', [
            'user' => $user,
            'follower_index' => $followerIndex,
        ]);
    }
}

