<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'min',
        'max',
        'label',
    ];

    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}