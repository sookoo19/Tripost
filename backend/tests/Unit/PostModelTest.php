<?php

namespace Tests\Unit;

use App\Models\Post;
use Tests\TestCase;

class PostModelTest extends TestCase
{
    public function test_fillable_contains_expected_fields(): void
    {
        $post = new Post();
        $fillable = $post->getFillable();

        foreach (['title', 'subtitle', 'description', 'region', 'period', 'days',
                  'post_status', 'share_scope', 'country_id', 'trip_plan', 'photos'] as $field) {
            $this->assertContains($field, $fillable, "fillable に '{$field}' が含まれていません");
        }
    }

    public function test_trip_plan_and_photos_are_cast_to_array(): void
    {
        $post = new Post();
        $casts = $post->getCasts();

        $this->assertArrayHasKey('trip_plan', $casts);
        $this->assertSame('array', $casts['trip_plan']);
        $this->assertArrayHasKey('photos', $casts);
        $this->assertSame('array', $casts['photos']);
    }

    public function test_is_liked_attribute_returns_false_when_not_authenticated(): void
    {
        // 未認証状態では is_liked が false を返すことを確認
        $post = new Post();
        $this->assertFalse($post->getIsLikedAttribute());
    }

    public function test_appends_includes_is_liked(): void
    {
        $post = new Post();
        $this->assertContains('is_liked', $post->getAppends());
    }
}
