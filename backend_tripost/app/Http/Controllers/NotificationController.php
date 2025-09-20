<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Notification;

class NotificationController extends Controller
{
    /**
     * 通知一覧を表示
     */
    public function index()
    {
        $user = Auth::user();
        
        // 通知を取得（アクター情報も一緒に）
        $notifications = $user->notifications()
            ->with(['actor' => function($query) {
                $query->select('id', 'displayid', 'profile_image');
                // アクセサを追加してもwithには反映されないため、
                // コレクション取得後に加工する必要があります
            }])
            ->latest()
            ->paginate(10);
        
        // profile_image_urlを各通知のactorに追加
        $notifications->getCollection()->transform(function ($notification) {
            if ($notification->actor) {
                $notification->actor->profile_image_url = 
                    $notification->actor->profile_image ? 
                    \Illuminate\Support\Facades\Storage::url($notification->actor->profile_image) : 
                    null;
            }
            return $notification;
        });
        
        // 表示時に全て既読にする
        $user->notifications()->where('read', false)->update(['read' => true]);
        
        // Inertiaレンダリングの場合はそのまま返す
        if (request()->wantsJson()) {
            return response()->json(['notifications' => $notifications]);
        }
        
        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * 未読の通知数を取得（APIエンドポイント）
     */
    public function getUnreadCount()
    {
        if (!Auth::check()) {
            return response()->json(['count' => 0]);
        }
        
        $user = Auth::user();
        $count = $user ? $user->unreadNotificationsCount() : 0;
        
        return response()->json(['count' => $count]);
    }

    /**
     * 全ての通知を既読にする
     */
    public function markAllAsRead()
    {
        if (!Auth::check()) {
            return response()->json(['error' => '認証が必要です'], 401);
        }
        
        $user = Auth::user();
        $user->notifications()->where('read', false)->update(['read' => true]);
        
        return response()->json(['success' => true]);
    }

    /**
     * 通知を既読にする
     */
    public function markAsRead(Notification $notification)
    {
        // 自分の通知のみ更新可能
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['error' => '許可されていません'], 403);
        }
        
        $notification->update(['read' => true]);
        
        return response()->json(['success' => true]);
    }
}