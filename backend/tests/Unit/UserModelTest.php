<?php

namespace Tests\Unit;

use App\Models\User;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    public function test_fillable_contains_expected_fields(): void
    {
        $user = new User();
        $fillable = $user->getFillable();

        foreach (['name', 'email', 'password', 'displayid', 'profile_image', 'bio'] as $field) {
            $this->assertContains($field, $fillable, "fillable に '{$field}' が含まれていません");
        }
    }

    public function test_hidden_contains_password_and_remember_token(): void
    {
        $user = new User();
        $hidden = $user->getHidden();

        $this->assertContains('password', $hidden);
        $this->assertContains('remember_token', $hidden);
    }

    public function test_email_verified_at_is_cast_to_datetime(): void
    {
        $user = new User();
        $casts = $user->getCasts();

        $this->assertArrayHasKey('email_verified_at', $casts);
        $this->assertSame('datetime', $casts['email_verified_at']);
    }

    public function test_password_is_cast_to_hashed(): void
    {
        $user = new User();
        $casts = $user->getCasts();

        $this->assertArrayHasKey('password', $casts);
        $this->assertSame('hashed', $casts['password']);
    }

    public function test_appends_includes_profile_image_url(): void
    {
        $user = new User();
        $this->assertContains('profile_image_url', $user->getAppends());
    }

    public function test_route_key_name_is_displayid(): void
    {
        $user = new User();
        $this->assertSame('displayid', $user->getRouteKeyName());
    }
}
