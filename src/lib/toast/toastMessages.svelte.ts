import { getContext, setContext } from 'svelte';

export type ToastType = 'success' | 'error';

export type ToastMessage = {
	id: string;
	message: string;
	type: ToastType;
	isShown: boolean;
};

const ToastMessagesKey = Symbol('ToastMessages');

export class ToastMessages {
	messages = $state<ToastMessage[]>([]);

	add(message: { message: string; type?: ToastType }) {
		const id = crypto.randomUUID();
		this.messages.push({
			id,
			message: message.message,
			type: message.type ?? 'success',
			isShown: false
		});
	}
}

export function setToastMessages() {
	return setContext(ToastMessagesKey, new ToastMessages());
}

export function getToastMessages() {
	return getContext<ToastMessages>(ToastMessagesKey);
}
