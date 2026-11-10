#![no_std]

#[unsafe(no_mangle)]
pub extern "C" fn luminance(red: u32, green: u32, blue: u32) -> u32 {
    (299 * red.min(255) + 587 * green.min(255) + 114 * blue.min(255) + 500) / 1000
}

#[unsafe(no_mangle)]
pub extern "C" fn light_percent(total: u32, pixels: u32) -> u32 {
    if pixels == 0 { return 0; }
    ((total as u64 * 100) / (pixels as u64 * 255)).min(100) as u32
}

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}
