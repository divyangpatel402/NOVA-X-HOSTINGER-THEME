<?php

namespace Pterodactyl\Http\Controllers\Admin\Extensions\versionchanger;

use Illuminate\Support\Facades\Http;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary as BlueprintExtensionLibrary;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class versionchangerExtensionController extends Controller
{
    public function __construct(
        private ViewFactory $view,
        private BlueprintExtensionLibrary $blueprint,
    ) {}

    private function types(): array
    {
        return cache()->remember('mcvapi_types', 60 * 60 * 24, function () {
            $url = $this->blueprint->dbGet('versionchanger', 'mcvapi_url') ?: 'https://versions.mcjars.app';
            $name = config('app.name', 'Pterodactyl');

            $req = Http::withUserAgent("Version Changer by 0x7d8 @ $name")
                ->timeout(5)
                ->retry(2, 100, throw: false)
                ->withHeaders([
                    'Authorization' => $this->blueprint->dbGet('versionchanger', 'mcvapi_key'),
                    'Origin' => env('APP_URL'),
                ])
                ->get("$url/api/v1/types");

            if (!$req->ok()) {
                return [];
            }

            return array_keys(json_decode($req->body(), true)['types']);
        });
    }

    public function index(): View
    {
        return $this->view->make(
            'admin.extensions.{identifier}.index', [
                'root' => '/admin/extensions/{identifier}',
                'blueprint' => $this->blueprint,
                'types' => implode(',', $this->types()),
                'used' => $this->blueprint->dbGet('versionchanger', 'mcvapi_types') ?: implode(',', $this->types()),
            ]
        );
    }

    public function post(versionchangerSettingsFormRequest $request): View
    {
        $this->blueprint->notify('Applied new settings');

        foreach ($request->validated() as $key => $value) {
            if ($key === 'mcvapi_types') {
                $value = strtoupper($value);
            }

            $this->blueprint->dbSet('versionchanger', $key, $value);
        }

        return $this->view->make(
            'admin.extensions.{identifier}.index', [
                'root' => '/admin/extensions/{identifier}',
                'blueprint' => $this->blueprint,
                'types' => implode(',', $this->types()),
                'used' => $this->blueprint->dbGet('versionchanger', 'mcvapi_types') ?: implode(',', $this->types()),
            ]
        );
    }
}

class versionchangerSettingsFormRequest extends AdminFormRequest
    {
        public function rules(): array
        {
            return [
                'mcvapi_url' => 'nullable|string|url',
                'mcvapi_key' => 'nullable|string|size:64',
                'mcvapi_types' => 'nullable|string',
            ];
        }
}