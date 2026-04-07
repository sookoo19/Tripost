<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CommentControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_add_a_comment(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user)
            ->post("/posts/{$post->id}/comments", ['body' => 'テストコメントです'])
            ->assertOk();

        $this->assertDatabaseHas('comments', [
            'post_id' => $post->id,
            'user_id' => $user->id,
            'body'    => 'テストコメントです',
        ]);
    }

    public function test_comment_body_is_required(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user)
            ->post("/posts/{$post->id}/comments", ['body' => ''])
            ->assertSessionHasErrors('body');
    }

    public function test_comment_body_cannot_exceed_2000_characters(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user)
            ->post("/posts/{$post->id}/comments", ['body' => str_repeat('あ', 2001)])
            ->assertSessionHasErrors('body');
    }

    public function test_guest_cannot_comment(): void
    {
        $post = Post::factory()->create();

        $this->post("/posts/{$post->id}/comments", ['body' => 'コメント'])
            ->assertRedirect('/auth/login');
    }
}
