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
             'title' => ['required', 'string', 'max:50'],
            'subtitle' => ['nullable', 'string', 'max:50'],
            'description'=> ['nullable', 'string', 'max:2000'],
            'region' => ['nullable', 'string', 'max:50'],
            'period' => ['nullable', 'date'],
            'days' => ['required', 'integer'],
            'post_status' => ['required', 'in:準備中,旅行中,旅行済'], 
            'share_scope' => ['required', 'in:非公開,公開'], 
            'country_id' => ['required', 'exists:countries,id'],
            'style_id' => ['required', 'exists:styles,id'],
            'purpose_id' => ['required', 'exists:purposes,id'],
            'budget_id' => ['required', 'exists:budgets,id'],
        ];
    }
}
