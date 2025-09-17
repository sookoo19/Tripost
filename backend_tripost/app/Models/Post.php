<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'description',
        'region',
        'period',
        'days',
        'post_status',
        'share_scope',
        'country_id',
        'style_id',
        'purpose_id',
        'budget_id',
        'trip_plan', // JSON保存するなら追加
        'photos',
    ];

    // 自動で配列にする（DBは JSON / TEXT ）
    protected $casts = [
        'trip_plan' => 'array',
        'photos' => 'array',
    ];

    protected $appends = ['is_liked'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function style()
    {
        return $this->belongsTo(Style::class);
    }
    
    public function purpose()
    {
        return $this->belongsTo(Purpose::class);
    }

    public function budget()
    {
        return $this->belongsTo(Budget::class);
    }

    public function likes() 
    { 
        return $this->hasMany(Like::class); 
    }

    public function comments() {
         return $this->hasMany(Comment::class); 
    }
    //（likes）は中間テーブルのため
    public function isLikedBy($userId) {
      return $this->likes()->where('user_id', $userId)->exists();
    }

    public function getIsLikedAttribute()
    {
        if (!auth()->check()) {
            return false;
        }
        
        // キャッシュしていない場合はDBにクエリ
        if (!array_key_exists('is_liked', $this->attributes)) {
            $this->attributes['is_liked'] = $this->likes()
                ->where('user_id', auth()->id())
                ->exists();
        }
        
        return $this->attributes['is_liked'];
    }
}
