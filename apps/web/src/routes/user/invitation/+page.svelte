<script lang="ts">
	import { error } from '@sveltejs/kit';
	import type { Attachment } from 'svelte/attachments';

	import {
		getGuestContext,
		GuestDataError,
		GuestCsvError,
		parseGuestCsv,
		type Guest,
		type GuestCsvRow,
		type GuestInput,
		type GuestStatus
	} from '#lib/features/guests/index.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	import {
		DEFAULT_WHATSAPP_TEMPLATE,
		getWeddingContext,
		getWeddingInvitationUrl,
		WhatsappTemplateError,
		WeddingDataError
	} from '#lib/features/weddings/index.js';

	type TemplatePreviewPart = {
		text: string;
		href?: string;
	};
	type GuestSortField = 'name' | 'created_at';
	type SortDirection = 'ascending' | 'descending';
	type GuestStatusFilter = 'all' | GuestStatus;
	type GuestAction = 'share' | 'copy' | 'edit' | 'preview' | 'delete';
	const guestStatusOptions = [
		{ value: 'all', label: 'Semua status' },
		{ value: 'pending', label: 'Menunggu' },
		{ value: 'attending', label: 'Hadir' },
		{ value: 'not_attending', label: 'Tidak hadir' }
	] as const satisfies readonly { value: GuestStatusFilter; label: string }[];
	const toast = getToastContext();
	const guestState = getGuestContext();
	const weddingState = getWeddingContext();

	function emptyGuestForm(): GuestInput {
		return {
			name: '',
			whatsapp: '',
			guest_count: 1,
			rsvp_status: 'pending',
			message: ''
		};
	}

	const { weddingSlug, whatsappTemplate: initialWhatsappTemplate } = await getInvitationData();
	let guests = $derived(guestState.guests ?? []);

	let search = $state('');
	let guestSortField = $state<GuestSortField>('name');
	let guestSortDirection = $state<SortDirection>('ascending');
	let guestStatusFilter = $state<GuestStatusFilter>('all');
	let statusMenuOpen = $state(false);
	let statusMenuButton: HTMLButtonElement | undefined;
	let guestActionMenuGuest = $state<Guest | null>(null);
	let guestActionMenuButton: HTMLButtonElement | undefined;
	let guestActionMenuPosition = $state({ top: 0, left: 0 });
	let guestDialog: HTMLDialogElement | undefined;
	let csvDialog: HTMLDialogElement | undefined;
	let deleteDialog: HTMLDialogElement | undefined;
	let templateDialog: HTMLDialogElement | undefined;
	let templateEditor: HTMLDivElement | undefined;
	let editingId = $state<string | null>(null);
	let guestPendingDeletion = $state<Guest | null>(null);
	let form = $state<GuestInput>(emptyGuestForm());
	let isSaving = $state(false);
	let csvRows = $state<GuestCsvRow[]>([]);
	let csvFileName = $state('');
	let csvError = $state('');
	let isReadingCsv = $state(false);
	let isImportingCsv = $state(false);
	let deletingIds = $state<string[]>([]);
	let savedWhatsappTemplate = $state(initialWhatsappTemplate);
	let whatsappTemplateDraft = $state(initialWhatsappTemplate);
	let isSavingTemplate = $state(false);
	let selectedGuestStatusLabel = $derived(
		guestStatusOptions.find((option) => option.value === guestStatusFilter)?.label ?? 'Semua status'
	);

	async function getInvitationData() {
		try {
			const [, loadedWeddingSlug, whatsappTemplate] = await Promise.all([
				guestState.getGuests(),
				weddingState.getCurrentWeddingSlug(),
				weddingState.getWhatsappTemplate()
			]);

			return { weddingSlug: loadedWeddingSlug, whatsappTemplate };
		} catch (cause) {
			throw error(500, {
				message:
					cause instanceof GuestDataError ||
					cause instanceof WeddingDataError ||
					cause instanceof WhatsappTemplateError
						? cause.message
						: 'Data undangan gagal dimuat.'
			});
		}
	}

	const attachGuestDialog: Attachment<HTMLDialogElement> = (dialog) => {
		guestDialog = dialog;

		return () => {
			if (guestDialog === dialog) guestDialog = undefined;
		};
	};

	const attachCsvDialog: Attachment<HTMLDialogElement> = (dialog) => {
		csvDialog = dialog;

		return () => {
			if (csvDialog === dialog) csvDialog = undefined;
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

	const attachStatusMenu: Attachment<HTMLDivElement> = (element) => {
		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (target instanceof Node && !element.contains(target)) statusMenuOpen = false;
		};
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || !statusMenuOpen) return;

			statusMenuOpen = false;
			statusMenuButton?.focus();
		};

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeydown);
		};
	};

	const attachGuestActionMenu: Attachment<HTMLDivElement> = (element) => {
		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (element.contains(target) || target.closest('[data-guest-actions-trigger]')) return;

			closeGuestActionMenu();
		};
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;

			closeGuestActionMenu(true);
		};
		const handleViewportChange = () => closeGuestActionMenu();

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeydown);
		window.addEventListener('resize', handleViewportChange);
		window.addEventListener('scroll', handleViewportChange, true);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('resize', handleViewportChange);
			window.removeEventListener('scroll', handleViewportChange, true);
		};
	};

	function closeGuestActionMenu(restoreFocus = false) {
		const button = guestActionMenuButton;
		guestActionMenuGuest = null;
		guestActionMenuButton = undefined;

		if (restoreFocus) button?.focus();
	}

	function toggleGuestActionMenu(event: MouseEvent, guest: Guest) {
		const button = event.currentTarget;
		if (!(button instanceof HTMLButtonElement)) return;

		if (guestActionMenuGuest?.id === guest.id) {
			closeGuestActionMenu(true);
			return;
		}

		const rect = button.getBoundingClientRect();
		const menuWidth = 164;
		const menuHeight = 224;
		const viewportPadding = 12;
		const gap = 8;
		let top = rect.bottom + gap;

		if (top + menuHeight > window.innerHeight - viewportPadding) {
			top = Math.max(viewportPadding, rect.top - menuHeight - gap);
		}

		guestActionMenuButton = button;
		guestActionMenuPosition = {
			top,
			left: Math.min(
				window.innerWidth - menuWidth - viewportPadding,
				Math.max(viewportPadding, rect.right - menuWidth)
			)
		};
		guestActionMenuGuest = guest;
	}

	function selectGuestStatus(status: GuestStatusFilter) {
		guestStatusFilter = status;
		statusMenuOpen = false;
		statusMenuButton?.focus();
	}

	let filteredGuests = $derived.by(() => {
		const normalizedSearch = search.trim().toLocaleLowerCase('id-ID');
		const filtered = guests.filter((guest) => {
			const matchesSearch = `${guest.name} ${guest.whatsapp}`
				.toLocaleLowerCase('id-ID')
				.includes(normalizedSearch);
			const matchesStatus = guestStatusFilter === 'all' || guest.rsvp_status === guestStatusFilter;

			return matchesSearch && matchesStatus;
		});

		return [...filtered].sort((left, right) => {
			const comparison =
				guestSortField === 'created_at'
					? left.created_at.localeCompare(right.created_at)
					: left.name.localeCompare(right.name, 'id');

			return guestSortDirection === 'ascending' ? comparison : -comparison;
		});
	});
	let importableCsvRows = $derived(csvRows.filter((row) => !row.issue));
	let rejectedCsvRows = $derived(csvRows.filter((row) => row.issue));
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

	function openCsvDialog() {
		csvRows = [];
		csvFileName = '';
		csvError = '';
		csvDialog?.showModal();
	}

	function closeCsvDialog() {
		if (isReadingCsv || isImportingCsv) return;
		csvDialog?.close();
	}

	function markExistingGuests(rows: GuestCsvRow[]): GuestCsvRow[] {
		const existingNumbers = new Set(guests.map((guest) => guest.whatsapp));

		return rows.map((row) =>
			!row.issue && existingNumbers.has(row.normalizedWhatsapp)
				? { ...row, issue: 'Nomor sudah ada di daftar tamu.' }
				: row
		);
	}

	async function readCsvFile(event: Event) {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) return;

		const file = input.files?.[0];
		if (!file) return;

		csvRows = [];
		csvFileName = file.name;
		csvError = '';

		if (!file.name.toLocaleLowerCase('id-ID').endsWith('.csv')) {
			csvError = 'Pilih file dengan format .csv.';
			input.value = '';
			return;
		}

		if (file.size > 2 * 1024 * 1024) {
			csvError = 'Ukuran CSV maksimal 2 MB.';
			input.value = '';
			return;
		}

		isReadingCsv = true;

		try {
			csvRows = markExistingGuests(parseGuestCsv(await file.text()));
		} catch (error) {
			csvError = error instanceof GuestCsvError ? error.message : 'File CSV gagal dibaca.';
		} finally {
			isReadingCsv = false;
			input.value = '';
		}
	}

	async function importCsvGuests(event: SubmitEvent) {
		event.preventDefault();
		if (isImportingCsv || importableCsvRows.length === 0) return;

		isImportingCsv = true;

		try {
			const createdGuests = await guestState.createGuests(
				importableCsvRows.map((row) => row.input)
			);
			toast.success(`${createdGuests.length} tamu berhasil diimpor.`);
			csvDialog?.close();
		} catch (error) {
			toast.error(error instanceof GuestDataError ? error.message : 'Tamu dari CSV gagal diimpor.');
		} finally {
			isImportingCsv = false;
		}
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

	function toggleGuestSort(field: GuestSortField): void {
		if (guestSortField === field) {
			guestSortDirection = guestSortDirection === 'ascending' ? 'descending' : 'ascending';
			return;
		}

		guestSortField = field;
		guestSortDirection = field === 'created_at' ? 'descending' : 'ascending';
	}

	function guestSortAria(field: GuestSortField): SortDirection | 'none' {
		return guestSortField === field ? guestSortDirection : 'none';
	}

	function formatGuestDate(value: string): string {
		if (!value) return '-';

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '-';

		return new Intl.DateTimeFormat('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
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
				await guestState.createGuest(guestInput);
				toast.success('Tamu berhasil ditambahkan.');
			} else {
				await guestState.updateGuest(editingId, guestInput);
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
			await guestState.deleteGuest(guest.id);
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

	function guestInvitationUrl(guest: Guest): string {
		return getWeddingInvitationUrl(weddingSlug, guest.rsvp_token);
	}

	function renderInvitationTemplate(template: string, guest?: Guest): string {
		const invitationUrl = guest
			? guestInvitationUrl(guest)
			: getWeddingInvitationUrl(weddingSlug, 'tokencontohabcde');

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
			const updatedTemplate = await weddingState.updateWhatsappTemplate(safeTemplate);
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

	function hasGuestInvitationUrl(guest: Guest): boolean {
		if (!weddingSlug) {
			toast.error('Atur domain wedding terlebih dahulu.');
			return false;
		}

		if (!guest.rsvp_token) {
			toast.error('Token RSVP tamu tidak tersedia.');
			return false;
		}

		return true;
	}

	function openGuestInvitation(guest: Guest) {
		if (!hasGuestInvitationUrl(guest)) return;

		window.open(guestInvitationUrl(guest), '_blank', 'noopener,noreferrer');
	}

	async function copyGuestInvitationLink(guest: Guest) {
		if (!hasGuestInvitationUrl(guest)) return;

		try {
			await navigator.clipboard.writeText(guestInvitationUrl(guest));
			toast.success('Tautan undangan berhasil disalin.');
		} catch {
			toast.error('Tautan undangan gagal disalin.');
		}
	}

	function runGuestAction(action: GuestAction, guest: Guest) {
		closeGuestActionMenu();

		if (action === 'share') shareInvitation(guest);
		else if (action === 'copy') void copyGuestInvitationLink(guest);
		else if (action === 'edit') openEditForm(guest);
		else if (action === 'preview') openGuestInvitation(guest);
		else openDeleteDialog(guest);
	}

	function shareInvitation(guest: Guest) {
		if (!hasGuestInvitationUrl(guest)) return;

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
							class="field mt-2 w-full rounded-xl border border-gray-700 px-4 py-3 text-sm"
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
							class="field mt-2 w-full rounded-xl border border-gray-700 px-4 py-3 text-sm"
							placeholder="0812 3456 7890"
						/>
					</label>
				</div>

				<div class="mt-5 flex justify-end gap-3">
					<button
						type="button"
						onclick={closeDialog}
						disabled={isSaving}
						class="cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-60"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSaving}
						aria-busy={isSaving}
						class="cursor-pointer rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
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
			{@attach attachCsvDialog}
			onclick={(event) => event.target === event.currentTarget && closeCsvDialog()}
			oncancel={(event) => (isReadingCsv || isImportingCsv) && event.preventDefault()}
			class="guest-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 shadow-xl"
		>
			<form onsubmit={importCsvGuests}>
				<div class="border-b border-gray-200 p-5 sm:p-6">
					<h2 class="text-lg font-bold text-gray-900">Impor tamu dari CSV</h2>
					<p class="mt-2 text-sm leading-6 text-gray-500">
						Gunakan kolom <strong class="font-semibold text-gray-700">name</strong> dan
						<strong class="font-semibold text-gray-700">whatsapp</strong>. Maksimal 50 tamu per
						impor.
					</p>
				</div>

				<div class="space-y-5 p-5 sm:p-6">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<label class="block min-w-0 flex-1 text-sm font-medium text-gray-700">
							Pilih file CSV
							<input
								type="file"
								accept=".csv,text/csv"
								onchange={readCsvFile}
								disabled={isReadingCsv || isImportingCsv}
								class="mt-2 block w-full rounded-xl border border-gray-700 bg-white text-sm text-gray-500 file:mr-4 file:border-0 file:border-r file:border-gray-200 file:bg-gray-50 file:px-4 file:py-3 file:font-semibold file:text-gray-700 hover:file:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
							/>
						</label>
					</div>

					<div aria-live="polite">
						{#if isReadingCsv}
							<p class="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
								Membaca file CSV...
							</p>
						{:else if csvError}
							<p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{csvError}</p>
						{:else if csvRows.length > 0}
							<div class="flex flex-wrap items-center justify-between gap-2">
								<p class="text-sm font-semibold text-gray-900">{csvFileName}</p>
								<p class="text-xs text-gray-500">
									{importableCsvRows.length} siap diimpor · {rejectedCsvRows.length} dilewati
								</p>
							</div>

							<div class="mt-3 max-h-72 overflow-auto rounded-xl border border-gray-200">
								<table class="w-full min-w-144 text-left">
									<thead
										class="sticky top-0 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase"
									>
										<tr>
											<th class="px-4 py-3">Baris</th>
											<th class="px-4 py-3">Nama</th>
											<th class="px-4 py-3">WhatsApp</th>
											<th class="px-4 py-3">Hasil</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 text-sm">
										{#each csvRows as row (row.rowNumber)}
											<tr class:opacity-60={row.issue}>
												<td class="px-4 py-3 text-gray-500">{row.rowNumber}</td>
												<td class="px-4 py-3 font-medium text-gray-900">{row.input.name || '—'}</td>
												<td class="px-4 py-3 text-gray-600">{row.input.whatsapp || '—'}</td>
												<td class="px-4 py-3">
													{#if row.issue}
														<span class="text-xs font-semibold text-red-600">{row.issue}</span>
													{:else}
														<span class="text-xs font-semibold text-green-700">Siap</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>
				</div>

				<div class="flex justify-end gap-3 border-t border-gray-200 px-5 py-4 sm:px-6">
					<button
						type="button"
						onclick={closeCsvDialog}
						disabled={isReadingCsv || isImportingCsv}
						class="cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isReadingCsv || isImportingCsv || importableCsvRows.length === 0}
						aria-busy={isImportingCsv}
						class="cursor-pointer rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isImportingCsv
							? 'Mengimpor...'
							: importableCsvRows.length > 0
								? `Impor ${importableCsvRows.length} tamu`
								: 'Impor tamu'}
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
						class="cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-60"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isDeletingGuest || !guestPendingDeletion}
						aria-busy={isDeletingGuest}
						class="cursor-pointer rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
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
						class="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-xl text-gray-500 transition sm:top-5 sm:right-5"
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
								class="cursor-pointer rounded-full border border-green-200 bg-green-50 px-3 py-1.5 font-mono text-xs font-semibold text-green-800"
								>+ {`{nama}`}</button
							>
							<button
								type="button"
								onclick={() => insertTemplateVariable('{link}')}
								class="cursor-pointer rounded-full border border-green-200 bg-green-50 px-3 py-1.5 font-mono text-xs font-semibold text-green-800"
								>+ {`{link}`}</button
							>
							<button
								type="button"
								onclick={() => insertTemplateVariable('{jumlah}')}
								class="cursor-pointer rounded-full border border-green-200 bg-green-50 px-3 py-1.5 font-mono text-xs font-semibold text-green-800"
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
							class="field rich-template mt-3 min-h-80 w-full overflow-y-auto rounded-2xl border border-gray-700 bg-white px-4 py-4 text-sm leading-6 text-gray-800"
						></div>
						<div class="mt-2 flex items-center justify-between gap-4 text-xs text-gray-400">
							<span>Variabel <strong class="text-gray-600">{`{link}`}</strong> wajib tersedia.</span
							>
							<span>{templateTextLength} karakter pesan</span>
						</div>
					</div>

					<div>
						<p class="text-xs font-bold tracking-[0.16em] text-gray-500 uppercase">Pratinjau</p>
						<div class="mt-3 overflow-hidden rounded-3xl border border-[#d5ddd7] bg-[#efeae2]">
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
						class="cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
						>Gunakan template awal</button
					>
					<button
						type="submit"
						disabled={isSavingTemplate || !templateIsDirty}
						aria-busy={isSavingTemplate}
						class="cursor-pointer rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSavingTemplate ? 'Menyimpan...' : 'Simpan template'}
					</button>
				</div>
			</form>
		</dialog>

		<div class="rounded-2xl border border-gray-200 bg-white">
			<div class="border-b border-gray-200 p-5 sm:p-6">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex min-w-0 items-center gap-3">
						<label class="relative block min-w-0 flex-1 sm:max-w-56">
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
								class="field search-field w-full rounded-xl border border-gray-400 py-3 pr-4 pl-12 text-sm placeholder:text-gray-300"
								placeholder="Cari"
							/>
						</label>

						<div {@attach attachStatusMenu} class="relative min-w-0 flex-1 sm:max-w-56">
							<button
								bind:this={statusMenuButton}
								type="button"
								aria-label="Filter status tamu"
								aria-haspopup="listbox"
								aria-controls="guest-status-options"
								aria-expanded={statusMenuOpen}
								onclick={() => (statusMenuOpen = !statusMenuOpen)}
								data-form-control
								class="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-400 bg-white py-3 pr-3.5 pl-4 text-left text-sm font-medium text-gray-700"
							>
								<span class="truncate">{selectedGuestStatusLabel}</span>
								<svg
									aria-hidden="true"
									class="size-4 shrink-0 transition-transform duration-150 {statusMenuOpen
										? 'rotate-180'
										: ''}"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="m7 9.5 5 5 5-5"></path>
								</svg>
							</button>

							{#if statusMenuOpen}
								<div
									id="guest-status-options"
									role="listbox"
									aria-label="Status tamu"
									class="absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
								>
									{#each guestStatusOptions as option (option.value)}
										<button
											type="button"
											role="option"
											aria-selected={guestStatusFilter === option.value}
											onclick={() => selectGuestStatus(option.value)}
											class="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-gray-100 {guestStatusFilter ===
											option.value
												? 'bg-gray-100 font-semibold text-gray-900'
												: 'font-medium text-gray-700'}"
										>
											<span>{option.label}</span>
											{#if guestStatusFilter === option.value}
												<svg
													aria-hidden="true"
													class="size-4 text-gray-700"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="m5 12 4 4L19 6"></path>
												</svg>
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<div class="flex shrink-0 gap-2">
						<button
							type="button"
							onclick={openTemplateDialog}
							title="Template pesan"
							class="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 transition lg:h-auto lg:w-auto lg:px-5 lg:py-3"
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
							onclick={openCsvDialog}
							title="Impor tamu dari CSV"
							class="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 transition lg:h-auto lg:w-auto lg:px-5 lg:py-3"
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
								<path d="M12 16V4M8 8l4-4 4 4"></path>
								<path d="M5 14v5h14v-5"></path>
							</svg>
							<span class="sr-only lg:not-sr-only">Impor CSV</span>
						</button>
						<button
							type="button"
							onclick={openCreateForm}
							title="Tambah tamu"
							class="inline-flex size-11 cursor-pointer items-center justify-center rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] text-sm font-semibold text-white transition lg:h-auto lg:w-auto lg:px-5 lg:py-3"
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
			</div>

			<div class="hidden overflow-x-auto sm:block">
				<table class="w-full min-w-200 text-left">
					<thead class="bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
						<tr>
							<th class="px-6 py-4" aria-sort={guestSortAria('name')}>
								<button
									type="button"
									class="inline-flex cursor-pointer items-center gap-2"
									onclick={() => toggleGuestSort('name')}
									title="Urutkan berdasarkan nama tamu"
								>
									Tamu
									<svg
										aria-hidden="true"
										class={`size-4 ${guestSortField === 'name' ? 'text-gray-900' : 'text-gray-400'}`}
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path
											class={guestSortField === 'name' && guestSortDirection === 'ascending'
												? ''
												: 'opacity-30'}
											d="m5 6 3-3 3 3"
										></path>
										<path
											class={guestSortField === 'name' && guestSortDirection === 'descending'
												? ''
												: 'opacity-30'}
											d="m5 10 3 3 3-3"
										></path>
									</svg>
								</button>
							</th>
							<th class="px-6 py-4">WhatsApp</th>
							<th class="px-6 py-4">Status</th>
							<th class="px-6 py-4" aria-sort={guestSortAria('created_at')}>
								<button
									type="button"
									class="inline-flex cursor-pointer items-center gap-2"
									onclick={() => toggleGuestSort('created_at')}
									title="Urutkan berdasarkan tanggal ditambahkan"
								>
									Date
									<svg
										aria-hidden="true"
										class={`size-4 ${guestSortField === 'created_at' ? 'text-gray-900' : 'text-gray-400'}`}
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path
											class={guestSortField === 'created_at' && guestSortDirection === 'ascending'
												? ''
												: 'opacity-30'}
											d="m5 6 3-3 3 3"
										></path>
										<path
											class={guestSortField === 'created_at' && guestSortDirection === 'descending'
												? ''
												: 'opacity-30'}
											d="m5 10 3 3 3-3"
										></path>
									</svg>
								</button>
							</th>
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
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
									{formatGuestDate(guest.created_at)}
								</td>
								<td class="px-6 py-4">
									<div class="flex justify-end">
										<button
											type="button"
											data-guest-actions-trigger
											onclick={(event) => toggleGuestActionMenu(event, guest)}
											aria-label={`Buka aksi untuk ${guest.name}`}
											aria-haspopup="menu"
											aria-expanded={guestActionMenuGuest?.id === guest.id}
											aria-controls={guestActionMenuGuest?.id === guest.id
												? 'guest-action-menu'
												: undefined}
											class="grid size-9 cursor-pointer place-items-center rounded-lg bg-violet-100 text-[#9400ff] transition"
										>
											<svg
												aria-hidden="true"
												class="size-5"
												viewBox="0 0 24 24"
												fill="currentColor"
											>
												<circle cx="12" cy="5" r="1.7"></circle>
												<circle cx="12" cy="12" r="1.7"></circle>
												<circle cx="12" cy="19" r="1.7"></circle>
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr
								><td colspan="5" class="px-6 py-12 text-center text-sm text-gray-500"
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
								<p class="mt-1 text-xs text-gray-400">{formatGuestDate(guest.created_at)}</p>
							</div>
							<span
								class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold {statusClass(
									guest.rsvp_status
								)}">{statusLabel(guest.rsvp_status)}</span
							>
						</div>
						<div class="mt-4 flex justify-end">
							<button
								type="button"
								data-guest-actions-trigger
								onclick={(event) => toggleGuestActionMenu(event, guest)}
								aria-label={`Buka aksi untuk ${guest.name}`}
								aria-haspopup="menu"
								aria-expanded={guestActionMenuGuest?.id === guest.id}
								aria-controls={guestActionMenuGuest?.id === guest.id
									? 'guest-action-menu'
									: undefined}
								class="grid size-10 cursor-pointer place-items-center rounded-xl bg-violet-100 text-[#9400ff]"
							>
								<svg aria-hidden="true" class="size-5" viewBox="0 0 24 24" fill="currentColor">
									<circle cx="12" cy="5" r="1.7"></circle>
									<circle cx="12" cy="12" r="1.7"></circle>
									<circle cx="12" cy="19" r="1.7"></circle>
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

	{#if guestActionMenuGuest}
		{@const selectedGuest = guestActionMenuGuest}
		<div
			{@attach attachGuestActionMenu}
			id="guest-action-menu"
			role="menu"
			aria-label={`Aksi untuk ${selectedGuest.name}`}
			class="fixed z-50 w-41 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
			style:top={`${guestActionMenuPosition.top}px`}
			style:left={`${guestActionMenuPosition.left}px`}
		>
			<button
				type="button"
				role="menuitem"
				onclick={() => runGuestAction('share', selectedGuest)}
				class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
			>
				<svg
					aria-hidden="true"
					class="size-4.5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m3 11 18-8-8 18-2.5-7.5L3 11Z"></path>
					<path d="m10.5 13.5 4-4"></path>
				</svg>
				Kirim
			</button>
			<button
				type="button"
				role="menuitem"
				onclick={() => runGuestAction('copy', selectedGuest)}
				class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
			>
				<svg
					aria-hidden="true"
					class="size-4.5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
				>
					<rect x="8" y="8" width="12" height="12" rx="2"></rect>
					<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
				</svg>
				Salin Tautan
			</button>
			<button
				type="button"
				role="menuitem"
				onclick={() => runGuestAction('edit', selectedGuest)}
				class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
			>
				<svg
					aria-hidden="true"
					class="size-4.5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m14 5 5 5M4 20l3.5-.7L19 7.8a2.1 2.1 0 0 0-3-3L4.7 16.5 4 20Z"></path>
				</svg>
				Sunting
			</button>
			<button
				type="button"
				role="menuitem"
				onclick={() => runGuestAction('preview', selectedGuest)}
				class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
			>
				<svg
					aria-hidden="true"
					class="size-4.5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M14 4h6v6M20 4l-9 9"></path>
					<path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"></path>
				</svg>
				Pratinjau
			</button>
			<button
				type="button"
				role="menuitem"
				disabled={deletingIds.includes(selectedGuest.id)}
				onclick={() => runGuestAction('delete', selectedGuest)}
				class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<svg
					aria-hidden="true"
					class="size-4.5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path>
				</svg>
				Hapus
			</button>
		</div>
	{/if}
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
