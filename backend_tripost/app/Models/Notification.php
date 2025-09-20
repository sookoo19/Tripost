<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'actor_id',
        'type',
        'notifiable_id',
        'notifiable_type',
        'read',
    ];

    //Accesorで定義
    protected $appends = ['message', 'date'];

    // 通知を受け取るユーザー
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // アクションを起こしたユーザー
    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    // 関連オブジェクト（多態的関連）
    public function notifiable()
    {
        return $this->morphTo();
    }

    // 関連する投稿（type が like の場合）
    public function post()
    {
        return $this->type === 'like' && $this->notifiable_type === Post::class
            ? Post::find($this->notifiable_id)
            : null;
    }

    // メッセージを生成するアクセサ
    protected function message(): Attribute
    {
        return Attribute::make(
            get: function () {
                $actor = $this->actor;
                if (!$actor) return '通知';

                switch ($this->type) {
                    case 'follow':
                        return "{$actor->name}さんがあなたをフォローしました";
                    
                    case 'like':
                        $post = $this->post();
                        if (!$post) return "{$actor->name}さんがあなたの投稿にいいねしました";
                        
                        $title = $post->title ?? '投稿';
                        return "{$actor->name}さんがあなたの投稿「{$title}」にいいねしました";
                    
                    default:
                        return '新しい通知があります';
                }
            }
        );
    }

    // 日付フォーマット用アクセサ
    protected function date(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->created_at ? $this->created_at->format('n月j日 H:i') : null
        );
    }
}
