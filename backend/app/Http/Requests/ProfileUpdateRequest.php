<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;                
use Illuminate\Validation\Rule; 

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'profile_image' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    // 空・null・空文字・画像パスの文字列も許容
                    if (empty($value) || is_string($value)) return;
                    if (!($value instanceof \Illuminate\Http\UploadedFile)) {
                        $fail('画像ファイル（jpg, jpeg, png, webp）を指定してください。');
                        return;
                    }
                    if (!$value->isValid() || !in_array($value->extension(), ['jpg', 'jpeg', 'png', 'webp'])) {
                        $fail('画像ファイル（jpg, jpeg, png, webp）を指定してください。');
                    }
                    // 10MB 上限（バイトで比較）
                    if ($value->getSize() !== null && $value->getSize() > 10 * 1024 * 1024) {
                        $fail('画像は10MB以下にしてください。');
                        return;
                    }
                }
            ],
            'name' => ['nullable', 'string', 'max:50'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'visited_countries' => ['array'],
            'visited_countries.*' => ['string'],
        ];
    }
}
