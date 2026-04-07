<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    // ────────────────────────────────────────────────
    // index
    // ────────────────────────────────────────────────

    public function test_guest_can_view_post_index(): void
    {
        $response = $this->get('/posts');

        $response->assertOk();
    }

    public function test_index_returns_only_public_posts(): void
    {
        Storage::fake('s3');

        Post::factory()->count(3)->create(['share_scope' => '公開']);
        Post::factory()->count(2)->private()->create();

        $response = $this->get('/posts');

        $response->assertOk();
    }

    // ────────────────────────────────────────────────
    // create / store
    // ────────────────────────────────────────────────

    public function test_guest_cannot_access_create_page(): void
    {
        $this->get('/posts/create')->assertRedirect('/auth/login');
    }

    public function test_authenticated_user_can_access_create_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/posts/create')->assertOk();
    }

    public function test_authenticated_user_can_store_post(): void
    {
        Storage::fake('s3');

        $user    = User::factory()->create();
        $country = Country::factory()->create();

        $data = [
            'title'       => 'テスト旅行',
            'period'      => '2024-06',
            'days'        => 3,
            'post_status' => '旅行済',
            'share_scope' => '公開',
            'country_id'  => $country->id,
        ];

        $response = $this->actingAs($user)->post('/posts', $data);

        $response->assertRedirect();
        $this->assertDatabaseHas('posts', [
            'title'   => 'テスト旅行',
            'user_id' => $user->id,
        ]);
    }

    public function test_guest_cannot_store_post(): void
    {
        $country = Country::factory()->create();

        $this->post('/posts', [
            'title'       => 'テスト',
            'period'      => '2024-06',
            'days'        => 1,
            'post_status' => '旅行済',
            'share_scope' => '公開',
            'country_id'  => $country->id,
        ])->assertRedirect('/auth/login');
    }

    public function test_store_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/posts', [])
            ->assertSessionHasErrors(['title', 'period', 'days', 'post_status', 'share_scope', 'country_id']);
    }

    // ────────────────────────────────────────────────
    // show
    // ────────────────────────────────────────────────

    public function test_guest_can_view_public_post(): void
    {
        Storage::fake('s3');

        $post = Post::factory()->create(['share_scope' => '公開']);

        $this->get("/posts/{$post->id}")->assertOk();
    }

    // ────────────────────────────────────────────────
    // update_share_scope
    // ────────────────────────────────────────────────

    public function test_user_can_update_share_scope(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id, 'share_scope' => '公開']);

        $response = $this->actingAs($user)
            ->patch("/posts/{$post->id}/sharescope", ['share_scope' => '非公開']);

        $response->assertOk();
        $response->assertJson(['ok' => true, 'share_scope' => '非公開']);
        $this->assertDatabaseHas('posts', ['id' => $post->id, 'share_scope' => '非公開']);
    }

    // ────────────────────────────────────────────────
    // destroy
    // ────────────────────────────────────────────────

    public function test_user_can_delete_own_post(): void
    {
        Storage::fake('s3');

        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->delete("/posts/{$post->id}");

        $response->assertJson(['ok' => true]);
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_guest_cannot_delete_post(): void
    {
        $post = Post::factory()->create();

        $this->delete("/posts/{$post->id}")->assertRedirect('/auth/login');
    }
}
