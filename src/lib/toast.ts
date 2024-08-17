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
			ripple: false
		},
		{
			type: 'warning',
			background: 'orange',
			duration: 5000,
			dismissible: true,
			ripple: false
		},
		{
			type: 'success',
			background: 'green',
			duration: 10000,
			dismissible: true,
			ripple: false
		},
		{
			type: 'error',
			background: 'indianred',
			duration: 5000,
			dismissible: true,
			ripple: false
		}
	]
});
