// @ts-ignore
export const toast = new Notyf({
	position: {
		x: 'center',
		y: 'top'
	},
	types: [
		{
			type: 'log',
			background: 'black',
			duration: 5000,
			dismissible: true,
			ripple: false,
			icon: false,
			className:
				'text-sm w-[320px] border rounded-xl shadow-lg !bg-neutral-800 !border-neutral-700 !text-neutral-400'
		},
		{
			type: 'warning',
			background: 'orange',
			duration: 5000,
			dismissible: true,
			ripple: false,
			icon: false,
			className:
				'text-sm w-[320px] border rounded-xl shadow-lg !bg-orange-800/20 !border-orange-700 !text-orange-400 !backdrop-brightness-0'
		},
		{
			type: 'success',
			background: 'green',
			duration: 5000,
			dismissible: true,
			ripple: false,
			icon: false,
			className:
				'text-sm w-[320px] border rounded-xl shadow-lg !bg-green-800/20 !border-green-700 !text-green-400 !backdrop-brightness-0'
		},
		{
			type: 'error',
			background: 'indianred',
			duration: 5000,
			dismissible: true,
			ripple: false,
			icon: false,
			className:
				'text-sm w-[320px] border rounded-xl shadow-lg !bg-red-800/20 !border-red-700 !text-red-400 !backdrop-brightness-0'
		}
	]
});
