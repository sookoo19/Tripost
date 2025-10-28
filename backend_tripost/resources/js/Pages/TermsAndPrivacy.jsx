import React from 'react';
import { Head } from '@inertiajs/react';

export default function TermsAndPrivacy() {
  return (
    <>
      <Head title='利用規約・プライバシーポリシー' />

      <div className='min-h-screen bg-white py-12 px-2 sm:px-4 lg:px-8'>
        <div className='max-w-4xl mx-auto bg-white p-8'>
          <h1 className='text-3xl font-bold text-center text-gray-900 mb-8'>
            Tripost 利用規約・プライバシーポリシー
          </h1>

          {/* 利用規約セクション */}
          <section className='mb-12'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2'>
              【利用規約】
            </h2>

            <p className='text-gray-700 mb-4 leading-relaxed'>
              この利用規約(以下、「本規約」といいます。)は、Kohei
              Suzuki(以下、「運営者」といいます。)が提供するアプリケーション「Tripost」(以下、「本サービス」といいます。)の利用条件を定めるものです。利用者(以下、「ユーザー」といいます。)は、本規約に同意した上で本サービスを利用するものとします。
            </p>

            <div className='space-y-6'>
              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第1条(適用)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  本規約は、ユーザーと運営者との間の本サービスの利用に関わる一切の関係に適用されます。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第2条(利用登録)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  ユーザーは、運営者の定める方法により利用登録を行い、登録が完了した時点で本規約に同意したものとみなします。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第3条(禁止事項)
                </h3>
                <p className='text-gray-700 mb-2'>
                  ユーザーは、以下の行為をしてはなりません。
                </p>
                <ul className='list-disc list-inside text-gray-700 space-y-1 ml-4'>
                  <li>・法令または公序良俗に違反する行為</li>
                  <li>・サーバーやネットワークの機能を妨害する行為</li>
                  <li>・他のユーザーの個人情報を収集または蓄積する行為</li>
                  <li>・本サービスの運営を妨害する行為</li>
                  <li>・不正アクセス、またはこれを試みる行為</li>
                </ul>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第4条(本サービスの提供の停止等)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  運営者は、システム保守、天災、通信障害などの理由により、本サービスの提供を一時的に停止することがあります。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第5条(免責事項)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  運営者は、本サービスに関して生じた損害について、一切の責任を負わないものとします。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第6条(著作権)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  本サービス内のコンテンツ(テキスト、画像、デザイン等)の著作権は運営者または正当な権利者に帰属します。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第7条(利用規約の変更)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  運営者は、必要と判断した場合、ユーザーに通知することなく本規約を変更することができます。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第8条(準拠法・裁判管轄)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  本規約の解釈には日本法を準拠法とし、本サービスに関して生じた紛争については、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄とします。
                </p>
              </div>
            </div>
          </section>

          {/* プライバシーポリシーセクション */}
          <section className='mb-8'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4 mt-12 border-b-2 border-green-500 pb-2'>
              【プライバシーポリシー】
            </h2>

            <p className='text-gray-700 mb-4 leading-relaxed'>
              本プライバシーポリシーは、Kohei
              Suzuki(以下、「運営者」といいます。)が提供する「Tripost」(以下、「本サービス」といいます。)における、ユーザーの個人情報の取り扱いについて定めたものです。
            </p>

            <div className='space-y-6'>
              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第1条(収集する情報)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  運営者は、ユーザーのメールアドレス、ユーザー名、パスワード、IPアドレス等を収集する場合があります。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第2条(利用目的)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  収集した情報は、ユーザー管理、問い合わせ対応、サービス改善、お知らせ等の目的で利用します。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第3条(第三者提供)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  運営者は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第4条(データの保存期間)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  ユーザーが本サービスを利用している間および利用終了後も、運営者は合理的な期間データを保持することがあります。削除を希望される場合は、
                  <a
                    href='mailto:kouhei20001011@gmail.com'
                    className='text-blue-600 hover:underline'
                  >
                    kouhei20001011@gmail.com
                  </a>
                  までご連絡ください。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第5条(セキュリティ)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  運営者は、ユーザー情報の漏洩、改ざん、紛失などを防止するため、適切な安全管理措置を講じます。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第6条(未成年の利用)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  13歳未満の方は、保護者の同意なく個人情報を提供しないようお願いいたします。
                </p>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                  第7条(プライバシーポリシーの変更)
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  運営者は、必要に応じて本プライバシーポリシーを変更することがあります。変更後の内容は、本アプリまたはウェブサイト上に掲載した時点で効力を生じます。
                </p>
              </div>
            </div>
          </section>

          {/* お問い合わせセクション */}
          <section className='bg-gray-100 rounded-lg p-6'>
            <h2 className='text-xl font-bold text-gray-800 mb-3'>
              【お問い合わせ先】
            </h2>
            <div className='text-gray-700 space-y-1'>
              <p>
                <span className='font-semibold'>運営者:</span> Kohei Suzuki
              </p>
              <p>
                <span className='font-semibold'>メールアドレス:</span>{' '}
                <a
                  href='mailto:kouhei20001011@gmail.com'
                  className='text-blue-600 hover:underline'
                >
                  kouhei20001011@gmail.com
                </a>
              </p>
              <p>
                <span className='font-semibold'>制定日:</span> 2025年10月15日
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
