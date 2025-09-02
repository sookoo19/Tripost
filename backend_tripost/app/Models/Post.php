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
        // 必要に応じて 'user_id' を追加（フォームから渡す場合のみ）
    ];

    // trip_plan を自動で配列にする（DBは JSON / TEXT ）
    protected $casts = [
        'trip_plan' => 'array',
    ];

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
}
