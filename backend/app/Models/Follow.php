<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Follow extends Model
{
    protected $fillable = [
        'following', // フォローしたユーザーの id（フォロワー）
        'followed',  // フォローされるユーザーの id（被フォロー者）
    ];

    // フォロワー（このフォローをしたユーザー）
    public function follower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'following');
    }

    // 被フォロー者（このフォローの対象ユーザー）
    public function followed(): BelongsTo
    {
        return $this->belongsTo(User::class, 'followed');
    }
}
