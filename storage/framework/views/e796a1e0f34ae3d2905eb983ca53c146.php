<?php $__env->startComponent('mail::message'); ?>
# ご登録ありがとうございます

この度はご登録いただき、ありがとうございます。  
メールアドレスを確認するため、下記のボタンをクリックしてください。

<?php $__env->startComponent('mail::button', ['url' => $verify_url]); ?>
メールアドレス確認
<?php echo $__env->renderComponent(); ?>

もしこのサービスへのアカウント登録に心当たりがない場合は、本メールは破棄してください。

---
<br/>

※「メールアドレス確認」ボタンがクリックできない場合、下記URLをコピーしてブラウザに貼り付けてください。  
[<?php echo new \Illuminate\Support\EncodedHtmlString($verify_url); ?>](<?php echo new \Illuminate\Support\EncodedHtmlString($verify_url); ?>)

<br/>


※このメールは送信専用アドレスから送信されています。ご返信いただいても対応できませんのでご了承ください。

<br/>

---

<?php echo new \Illuminate\Support\EncodedHtmlString(config('app.name')); ?>

<?php echo $__env->renderComponent(); ?><?php /**PATH /var/www/html/resources/views/emails/verify_email.blade.php ENDPATH**/ ?>