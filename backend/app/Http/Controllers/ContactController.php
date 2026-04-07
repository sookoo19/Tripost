<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use App\Rules\DisplayIdFormat;

class ContactController extends Controller
{
    public function showForm()
    {
        return Inertia::render('Contact');
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'displayid' => ['required', 'string', 'min:5', 'max:50', new DisplayIdFormat()],
            'email'   => 'required|email',
            'message' => 'required|string|max:1000',
        ]);

        // メール用データを message -> body にマッピング
        $mailData = [
            'displayid' => $validated['displayid'],
            'email'     => $validated['email'],
            'body'      => $validated['message'],
        ];

        // 開発者へのメール送信
        Mail::send('emails.contact', $mailData, function($message) use ($mailData) {
            $message->to('kouhei20001011@gmail.com')
                    ->subject('【Tripost】お問い合わせ');
        });

        // ユーザーへの自動返信
        Mail::send('emails.contact_auto_reply', $mailData, function($message) use ($mailData) {
            $message->to($mailData['email'])
                    ->subject('【Tripost】お問い合わせを受け付けました');
        });

        return back()->with('success', 'お問い合わせを送信しました。');
    }
}
