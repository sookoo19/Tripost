<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class DisplayIdFormat implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // 英数字とアンダースコアのみチェック
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $value)) {
            $fail('ディスプレイIDは半角英数字とアンダースコア（_）のみ使用できます。');
        }
    }
}
