<script lang="ts">
	let { phoneNumber }: { phoneNumber: string } = $props();
	const whatsappUrl = $derived(`https://wa.me/${phoneNumber.replace(/\D/g, '')}`);
</script>

<a
	href={whatsappUrl}
	target="_blank"
	rel="noopener noreferrer"
	aria-label="Hubungi Wedez melalui WhatsApp (tab baru)"
	title="Chat WhatsApp"
	class="fixed right-[calc(1.5rem+env(safe-area-inset-right))] bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/15 transition-colors hover:bg-[#1ebe5d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600 sm:right-[calc(2rem+env(safe-area-inset-right))] sm:bottom-[calc(2rem+env(safe-area-inset-bottom))]"
>
	<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="size-8">
		<path
			d="M20.7 11.7a8.7 8.7 0 0 1-13 7.6L3 20.6l1.3-4.5a8.7 8.7 0 1 1 16.4-4.4Z"
			stroke="currentColor"
			stroke-width="1.7"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path
			d="M8.1 7.2c-.2-.5-.5-.5-.8-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-.9 2.3 0 1.3 1 2.6 1.2 2.8.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.4l-1.8-.8c-.3-.1-.5-.2-.7.2l-.9 1c-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2.1-.4 0-.6l-.6-1.7Z"
			fill="currentColor"
		/>
	</svg>
</a>
