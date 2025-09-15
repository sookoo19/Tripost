<?php

namespace App\Models;

// - use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\CustomVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Auth\MustVerifyEmail;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmailContract
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, MustVerifyEmail, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'displayid', //編集可能なuserID
        'profile_image', //プロフィール画像URL
        'bio', //自己紹介文

    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function visitedCountries()
    {
        return $this->belongsToMany(Country::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

     public function sendEmailVerificationNotification()
    {
        $this->notify(new CustomVerifyEmail());
    }

     //フォローしているユーザー・'follows'などの指定を省くと Laravel はデフォルトの pivot 名・カラム名（user_user / user_id など）を期待し、正しく動きません。
    public function following()
    {
        return $this->belongsToMany(User::class, 'follows','following', 'followed');
        
        
    }

    //フォローされているユーザー（pivot.followed = 自分の id, pivot.following = 相手の id）
    public function followers()
    {
        
        return $this->belongsToMany(User::class, 'follows','followed','following');
        
    }

    public function followerRelations()
    {
        return $this->hasMany(Follow::class, 'followed', 'id');
    }

    public function followingRelations()
    {
        return $this->hasMany(Follow::class, 'following', 'id');
    }

    // フォロワー数を取得するアクセサ
    public function getFollowersCountAttribute()
    {
        return $this->followerRelations()->count();
    }

    // フォロー数を取得するアクセサ
    public function getFollowingCountAttribute()
    {
        return $this->followingRelations()->count();
    }
}
