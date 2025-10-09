<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected const TEST_PASSWORD = 'Password123!';

    public function test_password_can_be_updated(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make(self::TEST_PASSWORD),
        ]);

        $response = $this->actingAs($user)
            ->from('/profile')
            ->put('/password', [
                'current_password' => self::TEST_PASSWORD,
                'password' => 'New-Password123!',
                'password_confirmation' => 'New-Password123!',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertTrue(Hash::check('New-Password123!', $user->refresh()->password));
    }

    public function test_correct_password_must_be_provided_to_update_password(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->from('/profile')
            ->put('/password', [
                'current_password' => 'wrong-password',
                'password' => 'New-Password123!',
                'password_confirmation' => 'New-Password123!',
            ]);

        $response
            ->assertSessionHasErrors('current_password')
            ->assertRedirect('/profile');
    }
}
