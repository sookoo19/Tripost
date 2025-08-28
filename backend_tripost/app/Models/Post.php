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
        // 必要に応じて他のカラムも追加
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
