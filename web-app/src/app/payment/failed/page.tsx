import Link from 'next/link';

export default function PaymentFailedPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-red-50">
            <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">❌</span>
                </div>
                <h1 className="text-3xl font-bold text-red-800 mb-2">Paiement Échoué</h1>
                <p className="text-red-600 mb-8">Une erreur est survenue lors du paiement. Veuillez réessayer.</p>

                <Link
                    href="/payment"
                    className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Réessayer
                </Link>
            </div>
        </div>
    );
}
