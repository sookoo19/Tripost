<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'region' => 'nullable|string|max:255',
            'period' => 'nullable|date_format:Y-m',
            'days' => 'nullable|integer|min:1|max:10',
            'post_status' => 'required|in:準備中,旅行中,旅行済',
            'share_scope' => 'required|in:非公開,公開',
            'country_id' => 'nullable|exists:countries,id',
            'style_id' => 'nullable|exists:styles,id',
            'purpose_id' => 'nullable|exists:purposes,id',
            'budget_id' => 'nullable|exists:budgets,id',

            // trip_plan は JSON → 配列として受け取り、構造を検証
            'trip_plan' => 'nullable|array',
            'trip_plan.*' => 'array',              // 各日
            'trip_plan.*.*' => 'array',            // 各日の各プラン（配列 [time, place, lat, lng]）
            'trip_plan.*.*.0' => 'nullable|date_format:H:i', // time
            'trip_plan.*.*.1' => 'nullable|string|max:255',  // place
            'trip_plan.*.*.2' => 'nullable|numeric',         // lat
            'trip_plan.*.*.3' => 'nullable|numeric',         // lng

            'photos' => 'nullable|array|max:8',
            'photos.*' => 'file|image|max:2048', // 2MB 上限に例
        ];
    }
}
