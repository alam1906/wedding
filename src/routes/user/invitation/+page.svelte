<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	import {
		GuestDataError,
		createGuest,
		deleteGuest as deleteGuestRecord,
		updateGuest,
		type Guest,
		type GuestInput,
		type GuestStatus
	} from '#lib/features/guests/index.js';
	import { toast } from '#lib/features/toast/index.js';
	import {
		DEFAULT_WHATSAPP_TEMPLATE,
		updateWhatsappTemplate,
		WhatsappTemplateError
	} from '#lib/features/weddings/index.js';

	type Props = {
		data: {
			guests: Guest[];
			weddingSlug: string;
			whatsappTemplate: string;
		};
	};
	type TemplatePreviewPart = {
		text: string;
		href?: string;
	};

	const invitationOrigin = 'https://wedding.onlytest.my.id';

	function emptyGuestForm(): GuestInput {
		return {
			name: '',
			whatsapp: '',
			guest_count: 1,
			rsvp_status: 'pending',
			message: ''
		};
	}

	let { data }: Props = $props();
	const initialWhatsappTemplate = untrack(() => data.whatsappTemplate);
	const initialGuests = untrack(() => data.guests);
	let guests = $state<Guest[]>([...initialGuests]);

	let search = $state('');
	let guestDialog: HTMLDialogElement | undefined;
	let deleteDialog: HTMLDialogElement | undefined;
	let templateDialog: HTMLDialogElement | undefined;
	let templateEditor: HTMLDivElement | undefined;
	let editingId = $state<string | null>(null);
	let guestPendingDeletion = $state<Guest | null>(null);
	let form = $state<GuestInput>(emptyGuestForm());
	let isSaving = $state(false);
	let deletingIds = $state<string[]>([]);
	let savedWhatsappTemplate = $derived(data.whatsappTemplate);
	let whatsappTemplateDraft = $derived(data.whatsappTemplate);
	let isSavingTemplate = $state(false);

	const attachGuestDialog: Attachment<HTMLDialogElement> = (dialog) => {
		guestDialog = dialog;

		return () => {
			if (guestDialog === dialog) guestDialog = undefined;
		};
	};

	const attachTemplateDialog: Attachment<HTMLDialogElement> = (dialog) => {
		templateDialog = dialog;

		return () => {
			if (templateDialog === dialog) templateDialog = undefined;
		};
	};

	const attachDeleteDialog: Attachment<HTMLDialogElement> = (dialog) => {
		deleteDialog = dialog;

		return () => {
			if (deleteDialog === dialog) deleteDialog = undefined;
		};
	};

	let filteredGuests = $derived(
		guests.filter((guest) =>
			`${guest.name} ${guest.whatsapp}`.toLowerCase().includes(search.trim().toLowerCase())
		)
	);
	let isDeletingGuest = $derived(
		guestPendingDeletion !== null && deletingIds.includes(guestPendingDeletion.id)
	);
	let templateIsDirty = $derived(whatsappTemplateDraft !== savedWhatsappTemplate);
	let templatePreview = $derived(renderInvitationTemplate(whatsappTemplateDraft, guests[0]));
	let templatePreviewParts = $derived(splitTemplatePreview(templatePreview));
	let templateTextLength = $derived(editorHtmlToWhatsapp(whatsappTemplateDraft).length);

	const attachTemplateEditor: Attachment<HTMLDivElement> = (editor) => {
		templateEditor = editor;
		const safeHtml = sanitizeEditorHtml(initialWhatsappTemplate);
		editor.innerHTML = safeHtml;
		whatsappTemplateDraft = safeHtml;

		const handleInput = () => {
			whatsappTemplateDraft = editor.innerHTML;
		};

		editor.addEventListener('input', handleInput);

		return () => {
			editor.removeEventListener('input', handleInput);
			if (templateEditor === editor) templateEditor = undefined;
		};
	};

	function openCreateForm() {
		editingId = null;
		form = emptyGuestForm();
		guestDialog?.showModal();
	}

	function openEditForm(guest: Guest) {
		editingId = guest.id;
		form = {
			name: guest.name,
			whatsapp: guest.whatsapp,
			guest_count: guest.guest_count,
			rsvp_status: guest.rsvp_status,
			message: guest.message
		};
		guestDialog?.showModal();
	}

	function closeDialog() {
		guestDialog?.close();
	}

	function openDeleteDialog(guest: Guest) {
		if (deletingIds.includes(guest.id)) return;

		guestPendingDeletion = guest;
		deleteDialog?.showModal();
	}

	function closeDeleteDialog() {
		if (isDeletingGuest) return;

		deleteDialog?.close();
		guestPendingDeletion = null;
	}

	function openTemplateDialog() {
		templateDialog?.showModal();
	}

	function closeTemplateDialog() {
		templateDialog?.close();
	}

	function normalizeGuestName(name: string): string {
		return name
			.trim()
			.replace(/\s+/g, ' ')
			.replace(
				/\p{L}[\p{L}\p{M}'’-]*/gu,
				(word) => `${word[0].toLocaleUpperCase('id-ID')}${word.slice(1).toLocaleLowerCase('id-ID')}`
			);
	}

	function sortGuests(items: Guest[]): Guest[] {
		return [...items].sort((left, right) => left.name.localeCompare(right.name, 'id'));
	}

	async function saveGuest(event: SubmitEvent) {
		event.preventDefault();

		if (isSaving) {
			return;
		}

		isSaving = true;
		const guestInput = { ...form, name: normalizeGuestName(form.name) };

		try {
			if (editingId === null) {
				guests = sortGuests([...guests, await createGuest(guestInput)]);
				toast.success('Tamu berhasil ditambahkan.');
			} else {
				const updatedGuest = await updateGuest(editingId, guestInput);
				guests = sortGuests(guests.map((guest) => (guest.id === editingId ? updatedGuest : guest)));
				toast.success('Data tamu berhasil diperbarui.');
			}

			closeDialog();
		} catch (error) {
			toast.error(error instanceof GuestDataError ? error.message : 'Data tamu gagal disimpan.');
		} finally {
			isSaving = false;
		}
	}

	async function confirmDeleteGuest(event: SubmitEvent) {
		event.preventDefault();
		const guest = guestPendingDeletion;

		if (!guest || deletingIds.includes(guest.id)) {
			return;
		}

		deletingIds = [...deletingIds, guest.id];

		try {
			await deleteGuestRecord(guest.id);
			guests = guests.filter((item) => item.id !== guest.id);
			toast.success('Tamu berhasil dihapus.');
			deleteDialog?.close();
			guestPendingDeletion = null;
		} catch (error) {
			toast.error(error instanceof GuestDataError ? error.message : 'Tamu gagal dihapus.');
		} finally {
			deletingIds = deletingIds.filter((id) => id !== guest.id);
		}
	}

	function sanitizeEditorHtml(value: string): string {
		const template = document.createElement('template');
		template.innerHTML = value;
		const allowedTags = new Set(['P', 'BR', 'A']);

		for (const element of [...template.content.querySelectorAll('*')]) {
			if (!allowedTags.has(element.tagName)) {
				element.replaceWith(...element.childNodes);
				continue;
			}

			for (const attribute of [...element.attributes]) {
				if (element.tagName === 'A' && attribute.name === 'href') {
					const href = attribute.value.trim();
					if (href === '{link}' || /^https?:\/\//i.test(href)) continue;
				}

				element.removeAttribute(attribute.name);
			}
		}

		return template.innerHTML;
	}

	function decodeEditorEntities(value: string): string {
		return value
			.replaceAll('&nbsp;', ' ')
			.replaceAll('&amp;', '&')
			.replaceAll('&lt;', '<')
			.replaceAll('&gt;', '>')
			.replaceAll('&quot;', '"')
			.replaceAll('&#39;', "'");
	}

	function editorHtmlToWhatsapp(value: string): string {
		return decodeEditorEntities(
			value
				.replace(/<br\s*\/?>/gi, '\n')
				.replace(
					/<a(?:\s[^>]*)?href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
					(_match, href: string, label: string) => {
						const plainLabel = label.replace(/<[^>]+>/g, '').trim();
						return plainLabel === href ? plainLabel : `${plainLabel}: ${href}`;
					}
				)
				.replace(/<\/(p|div)>/gi, '\n')
				.replace(/<[^>]+>/g, '')
		)
			.replace(/[ \t]+\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}

	function splitTemplatePreview(value: string): TemplatePreviewPart[] {
		const parts: TemplatePreviewPart[] = [];
		const urlPattern = /https?:\/\/[^\s]+/g;
		let lastIndex = 0;

		for (const match of value.matchAll(urlPattern)) {
			const index = match.index ?? 0;
			if (index > lastIndex) parts.push({ text: value.slice(lastIndex, index) });
			parts.push({ text: match[0], href: match[0] });
			lastIndex = index + match[0].length;
		}

		if (lastIndex < value.length) parts.push({ text: value.slice(lastIndex) });
		return parts.length > 0 ? parts : [{ text: value }];
	}

	function renderInvitationTemplate(template: string, guest?: Guest): string {
		const invitationUrl = guest
			? `${invitationOrigin}/${data.weddingSlug}?rsvp=${encodeURIComponent(guest.rsvp_token)}`
			: `${invitationOrigin}/${data.weddingSlug}?rsvp=tokencontohabcde`;

		return editorHtmlToWhatsapp(template)
			.replaceAll('{nama}', guest?.name || 'Nama tamu')
			.replaceAll('{link}', invitationUrl)
			.replaceAll('{jumlah}', String(guest?.guest_count ?? 1));
	}

	function invitationMessage(guest: Guest): string {
		return renderInvitationTemplate(savedWhatsappTemplate, guest);
	}

	function insertTemplateVariable(variable: '{nama}' | '{link}' | '{jumlah}') {
		templateEditor?.focus();
		document.execCommand(
			variable === '{link}' ? 'insertHTML' : 'insertText',
			false,
			variable === '{link}' ? '<a href="{link}">{link}</a>' : variable
		);
		whatsappTemplateDraft = templateEditor?.innerHTML ?? whatsappTemplateDraft;
	}

	function resetWhatsappTemplate() {
		whatsappTemplateDraft = DEFAULT_WHATSAPP_TEMPLATE;
		if (templateEditor) templateEditor.innerHTML = DEFAULT_WHATSAPP_TEMPLATE;
	}

	async function saveWhatsappTemplate(event: SubmitEvent) {
		event.preventDefault();
		if (isSavingTemplate) return;

		isSavingTemplate = true;

		try {
			const safeTemplate = sanitizeEditorHtml(whatsappTemplateDraft);
			const updatedTemplate = await updateWhatsappTemplate(safeTemplate);
			savedWhatsappTemplate = updatedTemplate;
			whatsappTemplateDraft = updatedTemplate;
			if (templateEditor) templateEditor.innerHTML = updatedTemplate;
			toast.success('Template WhatsApp berhasil disimpan.');
		} catch (error) {
			toast.error(
				error instanceof WhatsappTemplateError ? error.message : 'Template WhatsApp gagal disimpan.'
			);
		} finally {
			isSavingTemplate = false;
		}
	}

	function shareInvitation(guest: Guest) {
		if (!data.weddingSlug) {
			toast.error('Atur domain wedding terlebih dahulu.');
			return;
		}

		if (!guest.rsvp_token) {
			toast.error('Token RSVP tamu tidak tersedia.');
			return;
		}

		const whatsappNumber = guest.whatsapp.replace(/\D/g, '');
		const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(invitationMessage(guest))}`;

		window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
	}

	function statusClass(status: GuestStatus) {
		if (status === 'attending') return 'bg-green-50 text-green-700';
		if (status === 'not_attending') return 'bg-red-50 text-red-700';

		return 'bg-gray-100 text-gray-600';
	}

	function statusLabel(status: GuestStatus): string {
		if (status === 'attending') return 'Hadir';
		if (status === 'not_attending') return 'Tidak hadir';

		return 'Menunggu';
	}
</script>

<svelte:head>
	<title>Undangan — Wedez</title>
	<meta name="description" content="Kelola tampilan dan publikasi undangan pernikahan di Wedez." />
</svelte:head>

<section class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
	<div class="mx-auto w-full max-w-6xl space-y-5">
		<dialog
			{@attach attachGuestDialog}
			onclick={(event) => event.target === event.currentTarget && closeDialog()}
			class="guest-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 shadow-xl"
		>
			<form onsubmit={saveGuest} class="p-5 sm:p-6">
				<div>
					<h2 class="text-lg font-bold text-gray-900">
						{editingId === null ? 'Tambah tamu' : 'Edit tamu'}
					</h2>
				</div>

				<div class="mt-5 grid gap-4 sm:grid-cols-2">
					<label class="block text-sm font-medium text-gray-700">
						Nama tamu
						<input
							bind:value={form.name}
							required
							class="field mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
							placeholder="Nama lengkap"
						/>
					</label>
					<label class="block text-sm font-medium text-gray-700">
						Nomor WhatsApp
						<input
							bind:value={form.whatsapp}
							inputmode="tel"
							autocomplete="tel"
							required
							class="field mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
							placeholder="0812 3456 7890"
						/>
					</label>
				</div>

				<div class="mt-5 flex justify-end gap-3">
					<button
						type="button"
						onclick={closeDialog}
						disabled={isSaving}
						class="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSaving}
						aria-busy={isSaving}
						class="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isSaving
							? 'Sedang menyimpan...'
							: editingId === null
								? 'Tambah tamu'
								: 'Simpan perubahan'}
					</button>
				</div>
			</form>
		</dialog>

		<dialog
			{@attach attachDeleteDialog}
			onclick={(event) => event.target === event.currentTarget && closeDeleteDialog()}
			oncancel={(event) => isDeletingGuest && event.preventDefault()}
			onclose={() => (guestPendingDeletion = null)}
			class="guest-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-0 shadow-xl"
		>
			<form onsubmit={confirmDeleteGuest} class="p-5 sm:p-6">
				<h2 class="text-lg font-bold text-gray-900">Hapus tamu?</h2>
				<p class="mt-3 text-sm leading-6 text-gray-500">
					{#if guestPendingDeletion}
						<strong class="font-semibold text-gray-900">{guestPendingDeletion.name}</strong> akan dihapus
						dari daftar tamu.
					{/if}
				</p>
				<div class="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onclick={closeDeleteDialog}
						disabled={isDeletingGuest}
						class="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isDeletingGuest || !guestPendingDeletion}
						aria-busy={isDeletingGuest}
						class="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isDeletingGuest ? 'Sedang menghapus...' : 'Hapus'}
					</button>
				</div>
			</form>
		</dialog>

		<dialog
			{@attach attachTemplateDialog}
			onclick={(event) => event.target === event.currentTarget && closeTemplateDialog()}
			class="guest-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 shadow-xl"
		>
			<form onsubmit={saveWhatsappTemplate}>
				<div class="relative border-b border-gray-200 p-5 pr-16 sm:p-6 sm:pr-16">
					<div class="flex flex-wrap items-center gap-3">
						<h1 class="text-lg font-bold text-gray-900">Template</h1>
						<span class="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
							{templateIsDirty ? 'Belum disimpan' : 'Tersimpan'}
						</span>
					</div>
					<button
						type="button"
						onclick={closeTemplateDialog}
						aria-label="Tutup template"
						class="absolute top-4 right-4 grid size-9 place-items-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 sm:top-5 sm:right-5"
					>
						<svg
							aria-hidden="true"
							class="size-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
						>
							<path d="m6 6 12 12M18 6 6 18"></path>
						</svg>
					</button>
				</div>

				<div class="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.08fr_0.92fr]">
					<div>
						<div class="mt-3 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
							<button
								type="button"
								onclick={() => insertTemplateVariable('{nama}')}
								class="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 font-mono text-xs font-semibold text-green-800 hover:bg-green-100"
								>+ {`{nama}`}</button
							>
							<button
								type="button"
								onclick={() => insertTemplateVariable('{link}')}
								class="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 font-mono text-xs font-semibold text-green-800 hover:bg-green-100"
								>+ {`{link}`}</button
							>
							<button
								type="button"
								onclick={() => insertTemplateVariable('{jumlah}')}
								class="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 font-mono text-xs font-semibold text-green-800 hover:bg-green-100"
								>+ {`{jumlah}`}</button
							>
						</div>

						<div
							id="whatsapp-template"
							{@attach attachTemplateEditor}
							contenteditable="true"
							role="textbox"
							aria-multiline="true"
							aria-label="Isi template pesan WhatsApp"
							spellcheck="true"
							class="field rich-template mt-3 min-h-80 w-full overflow-y-auto rounded-2xl border border-gray-300 bg-white px-4 py-4 text-sm leading-6 text-gray-800"
						></div>
						<div class="mt-2 flex items-center justify-between gap-4 text-xs text-gray-400">
							<span>Variabel <strong class="text-gray-600">{`{link}`}</strong> wajib tersedia.</span
							>
							<span>{templateTextLength} karakter pesan</span>
						</div>
					</div>

					<div>
						<p class="text-xs font-bold tracking-[0.16em] text-gray-500 uppercase">Pratinjau</p>
						<div
							class="mt-3 overflow-hidden rounded-[1.5rem] border border-[#d5ddd7] bg-[#efeae2] shadow-sm"
						>
							<div class="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
								<span
									class="grid size-9 place-items-center rounded-full bg-white/15 text-sm font-bold"
									>{guests[0]?.name.slice(0, 1).toUpperCase() ?? 'T'}</span
								>
								<div>
									<p class="text-sm font-bold">{guests[0]?.name ?? 'Nama tamu'}</p>
									<p class="text-[11px] text-white/70">preview pesan</p>
								</div>
							</div>
							<div class="min-h-80 p-4">
								<div
									class="ml-auto max-w-[94%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] p-3 text-[13px] leading-5 whitespace-pre-wrap text-gray-800 shadow-sm"
								>
									{#each templatePreviewParts as part, index (`${index}-${part.text}`)}
										{#if part.href}
											<a
												href={part.href}
												target="_blank"
												rel="noreferrer"
												class="text-[#027eb5] underline underline-offset-2">{part.text}</a
											>
										{:else}
											{part.text}
										{/if}
									{/each}
									<span class="mt-1 block text-right text-[10px] text-gray-500">sekarang</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div
					class="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"
				>
					<button
						type="button"
						onclick={resetWhatsappTemplate}
						disabled={isSavingTemplate}
						class="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
						>Gunakan template awal</button
					>
					<button
						type="submit"
						disabled={isSavingTemplate || !templateIsDirty}
						aria-busy={isSavingTemplate}
						class="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSavingTemplate ? 'Menyimpan...' : 'Simpan template'}
					</button>
				</div>
			</form>
		</dialog>

		<div class="rounded-2xl border border-gray-200 bg-white shadow-sm">
			<div
				class="flex flex-col gap-4 border-b border-gray-200 p-5 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between sm:p-6"
			>
				<label class="relative block min-w-0 flex-1 sm:max-w-md">
					<span class="sr-only">Cari tamu</span>
					<svg
						aria-hidden="true"
						class="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gray-400"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<circle cx="11" cy="11" r="7"></circle>
						<path d="m16 16 4 4"></path>
					</svg>
					<input
						bind:value={search}
						class="field w-full rounded-xl border border-gray-300 py-3 pr-4 pl-12 text-sm"
						placeholder="Cari nama atau nomor WhatsApp"
					/>
				</label>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={openTemplateDialog}
						title="Template pesan"
						class="inline-flex size-11 items-center justify-center rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-100 lg:h-auto lg:w-auto lg:px-5 lg:py-3"
					>
						<svg
							aria-hidden="true"
							class="size-5 lg:hidden"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M7 3h7l3 3v15H7z"></path>
							<path d="M10 11h4M10 15h4"></path>
						</svg>
						<span class="sr-only lg:not-sr-only">Template</span>
					</button>
					<button
						type="button"
						onclick={openCreateForm}
						title="Tambah tamu"
						class="inline-flex size-11 items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white transition hover:bg-gray-700 lg:h-auto lg:w-auto lg:px-5 lg:py-3"
					>
						<svg
							aria-hidden="true"
							class="size-5 lg:hidden"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="10" cy="8" r="3"></circle>
							<path d="M4.5 20a5.5 5.5 0 0 1 11 0"></path>
							<path d="M19 8v6M16 11h6"></path>
						</svg>
						<span class="sr-only lg:not-sr-only">Tambah tamu</span>
					</button>
				</div>
			</div>

			<div class="hidden overflow-x-auto sm:block">
				<table class="w-full min-w-160 text-left">
					<thead class="bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
						<tr>
							<th class="px-6 py-4">Tamu</th>
							<th class="px-6 py-4">WhatsApp</th>
							<th class="px-6 py-4">Status</th>
							<th class="px-6 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each filteredGuests as guest (guest.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4">
									<p class="text-sm font-semibold text-gray-900">{guest.name}</p>
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">{guest.whatsapp || '-'}</td>
								<td class="px-6 py-4">
									<span
										class="rounded-full px-3 py-1 text-xs font-semibold {statusClass(
											guest.rsvp_status
										)}">{statusLabel(guest.rsvp_status)}</span
									>
								</td>
								<td class="px-6 py-4">
									<div class="flex justify-end gap-2">
										<button
											type="button"
											onclick={() => shareInvitation(guest)}
											aria-label={`Kirim undangan WhatsApp ke ${guest.name}`}
											title="Kirim lewat WhatsApp"
											class="grid size-9 place-items-center rounded-lg bg-green-50 text-green-700 transition hover:bg-green-100"
										>
											<svg
												aria-hidden="true"
												class="size-4"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z"></path>
												<path d="M9 8.5c.3 2.6 2 4.3 4.5 5l1-1c.2-.2.5-.3.8-.1l1.7.8"></path>
											</svg>
										</button>
										<button
											type="button"
											onclick={() => openEditForm(guest)}
											aria-label={`Edit ${guest.name}`}
											title="Edit tamu"
											class="grid size-9 place-items-center rounded-lg bg-gray-100 text-gray-700 transition hover:bg-gray-200"
										>
											<svg
												aria-hidden="true"
												class="size-4"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
											>
												<path d="m14 5 5 5M4 20l3.5-.7L19 7.8a2.1 2.1 0 0 0-3-3L4.7 16.5 4 20Z"
												></path>
											</svg>
										</button>
										<button
											type="button"
											onclick={() => openDeleteDialog(guest)}
											disabled={deletingIds.includes(guest.id)}
											aria-label={`Hapus ${guest.name}`}
											title="Hapus tamu"
											class="grid size-9 place-items-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
										>
											<svg
												aria-hidden="true"
												class="size-4"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
											>
												<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path>
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr
								><td colspan="4" class="px-6 py-12 text-center text-sm text-gray-500"
									>Tamu tidak ditemukan.</td
								></tr
							>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="divide-y divide-gray-200 sm:hidden">
				{#each filteredGuests as guest (guest.id)}
					<article class="p-5">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<h2 class="truncate font-semibold text-gray-900">{guest.name}</h2>
								<p class="mt-1 text-sm text-gray-500">{guest.whatsapp || '-'}</p>
							</div>
							<span
								class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold {statusClass(
									guest.rsvp_status
								)}">{statusLabel(guest.rsvp_status)}</span
							>
						</div>
						<div class="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onclick={() => shareInvitation(guest)}
								aria-label={`Kirim undangan WhatsApp ke ${guest.name}`}
								title="Kirim lewat WhatsApp"
								class="grid size-10 place-items-center rounded-xl bg-green-50 text-green-700"
							>
								<svg
									aria-hidden="true"
									class="size-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z"></path>
									<path d="M9 8.5c.3 2.6 2 4.3 4.5 5l1-1c.2-.2.5-.3.8-.1l1.7.8"></path>
								</svg>
							</button>
							<button
								type="button"
								onclick={() => openEditForm(guest)}
								aria-label={`Edit ${guest.name}`}
								class="grid size-10 place-items-center rounded-xl bg-gray-100 text-gray-700"
							>
								<svg
									aria-hidden="true"
									class="size-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
								>
									<path d="m14 5 5 5M4 20l3.5-.7L19 7.8a2.1 2.1 0 0 0-3-3L4.7 16.5 4 20Z"></path>
								</svg>
							</button>
							<button
								type="button"
								onclick={() => openDeleteDialog(guest)}
								disabled={deletingIds.includes(guest.id)}
								aria-label={`Hapus ${guest.name}`}
								class="grid size-10 place-items-center rounded-xl bg-red-50 text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<svg
									aria-hidden="true"
									class="size-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
								>
									<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path>
								</svg>
							</button>
						</div>
					</article>
				{:else}
					<p class="p-10 text-center text-sm text-gray-500">Tamu tidak ditemukan.</p>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.rich-template :global(p + p) {
		margin-top: 0.75rem;
	}

	.rich-template :global(a) {
		color: #027eb5;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.guest-dialog {
		opacity: 0;
		transform: translateY(14px) scale(0.98);
		transition:
			opacity 200ms ease,
			transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
			display 260ms,
			overlay 260ms;
		transition-behavior: allow-discrete;
	}

	.guest-dialog[open] {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.guest-dialog::backdrop {
		background: rgb(17 24 39 / 45%);
		backdrop-filter: blur(2px);
		opacity: 0;
		transition:
			opacity 220ms ease,
			display 260ms,
			overlay 260ms;
		transition-behavior: allow-discrete;
	}

	.guest-dialog[open]::backdrop {
		opacity: 1;
	}

	@starting-style {
		.guest-dialog[open] {
			opacity: 0;
			transform: translateY(14px) scale(0.98);
		}

		.guest-dialog[open]::backdrop {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.guest-dialog,
		.guest-dialog::backdrop {
			transition: none;
		}
	}
</style>
