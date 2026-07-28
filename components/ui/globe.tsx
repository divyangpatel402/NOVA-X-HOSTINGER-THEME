"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function Globe({ config }: { config: any }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [size, setSize] = useState(config.width || 600);

    useEffect(() => {
        if (!canvasRef.current) return;

        const updateSize = () => {
            const w = window.innerWidth;
            if (w < 600) setSize(300);
            else if (w < 992) setSize(400);
            else setSize(config.width || 600);
        };

        window.addEventListener('resize', updateSize);
        updateSize();

        return () => window.removeEventListener('resize', updateSize);
    }, [config.width]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        canvas.width = size;
        canvas.height = size;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.z = 2.8;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(size, size);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);

        const earthGroup = new THREE.Group();
        scene.add(earthGroup);

        const textureLoader = new THREE.TextureLoader();
        
        const earthGeo = new THREE.SphereGeometry(1, 64, 64);
        const earthMat = new THREE.MeshPhongMaterial({
            color: 0x0a0a1a,
            emissive: 0x020208,
            shininess: 25,
            transparent: true,
            opacity: 0.95
        });

        textureLoader.load(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/The_earth_at_night.jpg/1280px-The_earth_at_night.jpg',
            function(texture) {
                earthMat.map = texture;
                earthMat.color.set(0x666677);
                earthMat.emissive.set(0x080812);
                earthMat.needsUpdate = true;
            }
        );

        const earthMesh = new THREE.Mesh(earthGeo, earthMat);
        earthGroup.add(earthMesh);

        const atmosGeo = new THREE.SphereGeometry(1.05, 64, 64);
        const atmosMat = new THREE.MeshBasicMaterial({
            color: 0x4f46e5,
            transparent: true,
            opacity: 0.12,
            side: THREE.BackSide
        });
        const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
        earthGroup.add(atmosMesh);

        const atmos2Geo = new THREE.SphereGeometry(1.08, 64, 64);
        const atmos2Mat = new THREE.MeshBasicMaterial({
            color: 0x6366f1,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        const atmos2Mesh = new THREE.Mesh(atmos2Geo, atmos2Mat);
        earthGroup.add(atmos2Mesh);

        const wireGeo = new THREE.SphereGeometry(1.003, 40, 40);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x6366f1,
            wireframe: true,
            transparent: true,
            opacity: 0.03
        });
        const wireMesh = new THREE.Mesh(wireGeo, wireMat);
        earthGroup.add(wireMesh);

        function latLonToVec3(lat: number, lon: number, radius: number) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const x = -(radius * Math.sin(phi) * Math.cos(theta));
            const z = (radius * Math.sin(phi) * Math.sin(theta));
            const y = (radius * Math.cos(phi));
            return new THREE.Vector3(x, y, z);
        }

        if (config.markers) {
            config.markers.forEach((marker: any) => {
                const pos = latLonToVec3(marker.location[0], marker.location[1], 1.02);
                
                const dotGeo = new THREE.SphereGeometry(0.014, 16, 16);
                const dotMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
                const dot = new THREE.Mesh(dotGeo, dotMat);
                dot.position.copy(pos);
                earthGroup.add(dot);

                const ringGeo = new THREE.RingGeometry(0.016, 0.038, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0xfbbf24,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.position.copy(pos);
                ring.lookAt(new THREE.Vector3(0, 0, 0));
                earthGroup.add(ring);

                const glowGeo = new THREE.SphereGeometry(0.055, 16, 16);
                const glowMat = new THREE.MeshBasicMaterial({
                    color: 0xf59e0b,
                    transparent: true,
                    opacity: 0.18
                });
                const glow = new THREE.Mesh(glowGeo, glowMat);
                glow.position.copy(pos);
                earthGroup.add(glow);
            });
        }

        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xe0e0ff, 0.7);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        const blueLight = new THREE.PointLight(0x4f46e5, 0.5, 10);
        blueLight.position.set(-3, 2, 3);
        scene.add(blueLight);

        const goldLight = new THREE.PointLight(0xfbbf24, 0.3, 8);
        goldLight.position.set(3, -1, 4);
        scene.add(goldLight);

        let isDragging = false;
        let previousMouse = { x: 0, y: 0 };
        let rotationVelocity = { x: 0, y: 0 };
        let autoRotateSpeed = 0.002;

        const handleMouseDown = (e: MouseEvent) => {
            isDragging = true;
            previousMouse = { x: e.clientX, y: e.clientY };
            rotationVelocity = { x: 0, y: 0 };
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - previousMouse.x;
            const dy = e.clientY - previousMouse.y;
            
            rotationVelocity.x = dy * 0.005;
            rotationVelocity.y = dx * 0.005;

            earthGroup.rotation.x += rotationVelocity.x;
            earthGroup.rotation.y += rotationVelocity.y;

            previousMouse = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => { isDragging = false; };
        
        const handleTouchStart = (e: TouchEvent) => {
            isDragging = true;
            previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            rotationVelocity = { x: 0, y: 0 };
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return;
            e.preventDefault();
            const dx = e.touches[0].clientX - previousMouse.x;
            const dy = e.touches[0].clientY - previousMouse.y;
            
            rotationVelocity.x = dy * 0.005;
            rotationVelocity.y = dx * 0.005;

            earthGroup.rotation.x += rotationVelocity.x;
            earthGroup.rotation.y += rotationVelocity.y;

            previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        canvas.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleMouseUp);

        let animationFrameId: number;

        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            
            if (!isDragging) {
                earthGroup.rotation.y += autoRotateSpeed;
                rotationVelocity.x *= 0.95;
                rotationVelocity.y *= 0.95;
                earthGroup.rotation.x += rotationVelocity.x;
                earthGroup.rotation.y += rotationVelocity.y;
            }

            renderer.render(scene, camera);
        }
        
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
            renderer.dispose();
            scene.clear();
        };
    }, [size, config.markers]);

    return (
        <div className="relative flex justify-center items-center w-full h-full max-w-full">
            <canvas ref={canvasRef} style={{ cursor: 'grab', borderRadius: '50%', maxWidth: '100%', objectFit: 'contain' }} />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                </svg>
                Drag to rotate
            </div>
        </div>
    );
}
