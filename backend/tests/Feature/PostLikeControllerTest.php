<?php

namespace Tests\Feature;

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostLikeControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_like_a_post(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user)
            ->json('POST', "/posts/{$post->id}/like")
            ->assertOk()
            ->assertJson(['is_liked' => true]);

        $this->assertDatabaseHas('likes', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_liking_same_post_twice_does_not_create_duplicate(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user)->json('POST', "/posts/{$post->id}/like");
        $this->actingAs($user)->json('POST', "/posts/{$post->id}/like");

        $this->assertSame(1, Like::where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->count());
    }

    public function test_user_can_unlike_a_post(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $post = Post::factory()->create();

        Like::create(['user_id' => $user->id, 'post_id' => $post->id]);

        $this->actingAs($user)
            ->json('DELETE', "/posts/{$post->id}/like")
            ->assertOk()
            ->assertJson(['is_liked' => false]);

        $this->assertDatabaseMissing('likes', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_guest_cannot_like_a_post(): void
    {
        $post = Post::factory()->create();

        $this->json('POST', "/posts/{$post->id}/like")
            ->assertUnauthorized();
    }

    public function test_like_creates_notification_for_post_owner(): void
    {
        Storage::fake('s3');

        $owner = User::factory()->create();
        $liker = User::factory()->create();
        $post  = Post::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($liker)->json('POST', "/posts/{$post->id}/like");

        $this->assertDatabaseHas('notifications', [
            'user_id'  => $owner->id,
            'actor_id' => $liker->id,
            'type'     => 'like',
        ]);
    }

    public function test_like_does_not_notify_when_liking_own_post(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->json('POST', "/posts/{$post->id}/like");

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $user->id,
            'type'    => 'like',
        ]);
    }
}
