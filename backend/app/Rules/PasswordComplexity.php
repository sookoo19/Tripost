<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PasswordComplexity implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // 3種類以上の文字種チェック
        $types = 0;
        if (preg_match('/[a-z]/', $value)) $types++; // 英小文字
        if (preg_match('/[A-Z]/', $value)) $types++; // 英大文字
        if (preg_match('/[0-9]/', $value)) $types++; // 数字
        if (preg_match('/[!@#$%^&*(),.?":{}|<>]/', $value)) $types++; // 記号
        
        if ($types < 3) {
            $fail('パスワードは英大文字・英小文字・数字・記号のうち3種類以上を含む必要があります。');
        }
    }
}
